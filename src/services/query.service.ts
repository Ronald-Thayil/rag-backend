import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "@/config/database";
import { logger } from "@/config/logger";
import { embeddingConfig, queryConfig } from "@/config/embedding";
import { EmbeddingService } from "@/services/embedding.service";
import { LlmService } from "@/services/llm.service";
import { Chunk } from "@/modules/rag/chunks/chunk.model";
import { Document } from "@/modules/rag/documents/document.model";
import QueryTokenUsage from "@/modules/rag/query/models/query-token-usage.model";
import { AppError } from "@/shared/errors/app-error";

export interface QueryRequest {
  query: string;
  documentId?: string;
  topK: number;
  includeSources: boolean;
}

export interface SourceResult {
  documentId: string;
  filename: string;
  content: string;
  similarity: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceResult[];
  cacheHit: boolean;
  cacheSimilarity: number;
  processingTime: number;
}

interface ChunkWithSimilarity {
  document_id: string;
  content: string;
  similarity: number;
  document_filename: string;
}

export class QueryService {
  private embeddingService: EmbeddingService;
  private llmService: LlmService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.llmService = new LlmService();
  }

  async query(companyId: string, params: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    const queryId = uuidv4();

    const { query, documentId, topK, includeSources } = params;

    // 1. Embed the question
    let queryEmbedding: number[];
    let embeddingModel: string;
    let embeddingTokens: number;

    try {
      const embeddingResult = await this.embeddingService.embedTexts([query]);
      queryEmbedding = embeddingResult[0];
      embeddingModel = embeddingConfig.model;
      embeddingTokens = this.estimateTokens(query);
    } catch (error) {
      logger.error("Embedding failed", { error: (error as Error).message });
      throw new AppError("Failed to embed the question. Please try again.", 500);
    }

    // 2. Audit log embedding (only if embedding succeeded)
    await this.logTokenUsage({
      companyId,
      queryId,
      operationType: "embedding",
      model: embeddingModel,
      embeddingTokens,
      totalTokens: embeddingTokens,
      cacheHit: false,
    });

    // 3. Check semantic cache
    const cacheResult = await this.lookupCache(companyId, queryEmbedding, documentId);

    if (cacheResult && cacheResult.similarity >= queryConfig.similarityThreshold) {
      // Cache hit — increment hit counter, update last_used_at
      await this.incrementCacheHit(cacheResult.id);

      const processingTime = Date.now() - startTime;

      // Log cache hit audit entry (zero LLM tokens, cache_hit = true)
      await this.logTokenUsage({
        companyId,
        queryId,
        operationType: "llm_completion",
        model: "cache",
        totalTokens: 0,
        cacheHit: true,
      });

      return {
        answer: cacheResult.answer,
        sources: includeSources ? (cacheResult.sources as SourceResult[]) : [],
        cacheHit: true,
        cacheSimilarity: cacheResult.similarity,
        processingTime,
      };
    }

    // Cache miss — proceed with retrieval and LLM
    const cacheSimilarity = cacheResult ? cacheResult.similarity : 0;

    // 4. Retrieve chunks
    const chunks = await this.retrieveChunks(companyId, queryEmbedding, documentId, topK);

    if (chunks.length === 0) {
      const processingTime = Date.now() - startTime;
      return {
        answer: "No relevant documents found to answer your question.",
        sources: [],
        cacheHit: false,
        cacheSimilarity: 0,
        processingTime,
      };
    }

    // 5. Build context and call LLM
    const context = chunks.map((c) => c.content).join("\n\n---\n\n");

    let llmResult;
    try {
      llmResult = await this.llmService.generateAnswer(query, context, includeSources);
    } catch (error) {
      logger.error("LLM call failed", { error: (error as Error).message, queryId });
      // Embedding audit row already written; no completion row written
      throw new AppError("Failed to generate answer. Please try again.", 500);
    }

    // 6. Audit log LLM completion
    await this.logTokenUsage({
      companyId,
      queryId,
      operationType: "llm_completion",
      model: llmResult.model,
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      totalTokens: llmResult.totalTokens,
      cacheHit: false,
    });

    // Build sources
    const sources: SourceResult[] = chunks.map((c) => ({
      documentId: c.document_id,
      filename: c.document_filename || "unknown",
      content: c.content,
      similarity: c.similarity,
    }));

    // 7. Write to cache (best-effort, must not fail the request)
    try {
      await this.writeCache({
        companyId,
        documentId: documentId || null,
        question: query,
        embedding: queryEmbedding,
        answer: llmResult.answer,
        sources,
      });
    } catch (error) {
      logger.error("Cache write failed (non-fatal)", { error: (error as Error).message, queryId });
    }

    const processingTime = Date.now() - startTime;

    return {
      answer: llmResult.answer,
      sources: includeSources ? sources : [],
      cacheHit: false,
      cacheSimilarity,
      processingTime,
    };
  }
  async listAuditLogs(companyId: string): Promise<any[]> {
    const auditLogs = await QueryTokenUsage.findAll({
      where: { company_id: companyId },
      order: [["created_at", "DESC"]],
    });
    return auditLogs;
  }

  private async lookupCache(
    companyId: string,
    embedding: number[],
    documentId?: string,
  ): Promise<{ id: string; answer: string; sources: object; similarity: number } | null> {
    const embeddingStr = `[${embedding.join(",")}]`;

    const result = await sequelize.query(
      `SELECT id, answer, sources,
              1 - (question_embedding <=> :embedding::vector) AS similarity
       FROM semantic_query_cache
       WHERE company_id = :companyId
         AND (:documentId IS NULL AND document_id IS NULL
              OR :documentId IS NOT NULL AND document_id = :documentId::UUID)
       ORDER BY question_embedding <=> :embedding::vector
       LIMIT 1`,
      {
        replacements: {
          companyId,
          embedding: embeddingStr,
          documentId: documentId || null,
        },
        type: "SELECT",
      },
    );

    if (!result || (result as any[]).length === 0) {
      return null;
    }

    const row = (result as any[])[0];
    return {
      id: row.id,
      answer: row.answer,
      sources: typeof row.sources === "string" ? JSON.parse(row.sources) : row.sources,
      similarity: parseFloat(row.similarity),
    };
  }

  private async incrementCacheHit(cacheId: string): Promise<void> {
    await sequelize.query(
      `UPDATE semantic_query_cache
       SET hit_count = hit_count + 1, last_used_at = NOW()
       WHERE id = :cacheId`,
      { replacements: { cacheId }, type: "UPDATE" },
    );
  }

  private async writeCache(params: {
    companyId: string;
    documentId: string | null;
    question: string;
    embedding: number[];
    answer: string;
    sources: SourceResult[];
  }): Promise<void> {
    const embeddingStr = `[${params.embedding.join(",")}]`;
    const sourcesJson = JSON.stringify(params.sources);
    const id = uuidv4();
    await sequelize.query(
      `INSERT INTO semantic_query_cache (id, company_id, document_id, question, question_embedding, answer, sources, hit_count, last_used_at, created_at)
       VALUES (:id, :companyId, :documentId, :question, :embedding::vector, :answer, :sources::jsonb, 0, NOW(), NOW())`,
      {
        replacements: {
          id,
          companyId: params.companyId,
          documentId: params.documentId,
          question: params.question,
          embedding: embeddingStr,
          answer: params.answer,
          sources: sourcesJson,

        },
        type: "INSERT",
      },
    );
  }

  private async retrieveChunks(
    companyId: string,
    queryEmbedding: number[],
    documentId: string | undefined,
    topK: number,
  ): Promise<ChunkWithSimilarity[]> {
    const whereClause: any = {
      company_id: companyId,
      embedding: { [Op.ne]: null },
    };
    if (documentId) {
      whereClause.document_id = documentId;
    }

    const allChunks = await Chunk.findAll({
      where: whereClause,
      include: [
        {
          model: Document,
          attributes: ["original_filename"],
        },
      ],
    });

    const scored: ChunkWithSimilarity[] = [];

    for (const chunk of allChunks) {
      if (!chunk.embedding) continue;

      let chunkVector: number[];
      try {
        chunkVector = JSON.parse(chunk.embedding);
      } catch {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, chunkVector);

      scored.push({
        document_id: chunk.document_id,
        content: chunk.content,
        similarity,
        document_filename: (chunk as any).document?.original_filename || "unknown",
      });
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private async logTokenUsage(params: {
    companyId: string;
    queryId: string;
    operationType: string;
    model: string;
    embeddingTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens: number;
    cacheHit: boolean;
  }): Promise<void> {
    await QueryTokenUsage.create({
      company_id: params.companyId,
      query_id: params.queryId,
      operation_type: params.operationType,
      model: params.model,
      embedding_tokens: params.embeddingTokens || 0,
      prompt_tokens: params.promptTokens || 0,
      completion_tokens: params.completionTokens || 0,
      total_tokens: params.totalTokens,
      cache_hit: params.cacheHit,
      created_at: new Date(),
    });
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export default QueryService;
