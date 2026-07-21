/**
 * Query Service — RAG Pipeline Orchestrator
 *
 * This is the central orchestrator of the entire RAG pipeline. It coordinates:
 *   1. Query rewriting (Priority 6)
 *   2. Query embedding
 *   3. Semantic cache lookup
 *   4. Hybrid retrieval (Priority 3) — vector search + BM25 keyword search
 *   5. Hallucination guard via relevance threshold (Priority 5)
 *   6. Reranking (Priority 4)
 *   7. LLM answer generation with structured context (Priorities 1 & 2)
 *   8. Audit logging and cache writeback
 *
 * Pipeline flow (after constructor):
 *
 *   query()
 *     ├── 0. Rewrite query internally (if enabled)
 *     ├── 1. Embed question → query vector
 *     ├── 2. Audit-log embedding token usage
 *     ├── 3. Check semantic cache → return cached answer if hit
 *     ├── 4. Retrieve chunks
 *     │     ├── hybridSearchEnabled=true  → retrieveHybrid() (vector + BM25 + rerank)
 *     │     └── hybridSearchEnabled=false → retrieveVectorOnly() (original behavior)
 *     ├── 5. Hallucination guard: skip LLM if best score < relevanceThreshold
 *     ├── 6. Generate answer via LLM (with structured context + reasoning prompt)
 *     ├── 7. Audit-log LLM token usage
 *     ├── 8. Write to semantic cache (best-effort)
 *     └── 9. Return QueryResponse
 *
 * All new features are configurable via environment variables and default to
 * backward-compatible behavior (hybrid search defaults to true, threshold to 0.0).
 */
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "@/config/database";
import { logger } from "@/config/logger";
import { embeddingConfig, queryConfig } from "@/config/embedding";
import { EmbeddingService } from "@/services/embedding.service";
import { LlmService, ContextChunk } from "@/services/llm.service";
import { Bm25Service, Bm25Result } from "@/services/bm25.service";
import { RerankerService, RerankItem, RerankerResult } from "@/services/reranker.service";
import { QueryRewriterService } from "@/services/query-rewriter.service";
import { Chunk } from "@/modules/rag/chunks/chunk.model";
import { Document } from "@/modules/rag/documents/document.model";
import QueryTokenUsage from "@/modules/rag/query/models/query-token-usage.model";
import { AppError } from "@/shared/errors/app-error";

/** Input parameters for a RAG query. Unchanged from original API. */
export interface QueryRequest {
  query: string;
  documentId?: string;
  topK: number;
  includeSources: boolean;
}

/** A single source chunk returned in the response. Unchanged from original API. */
export interface SourceResult {
  documentId: string;
  filename: string;
  content: string;
  similarity: number;
}

/** Response shape. Unchanged from original API for backward compatibility. */
export interface QueryResponse {
  answer: string;
  sources: SourceResult[];
  cacheHit: boolean;
  cacheSimilarity: number;
  processingTime: number;
}

/** Internal shape for a chunk with its relevance score and metadata. */
interface ChunkWithSimilarity {
  document_id: string;
  content: string;
  similarity: number;
  document_filename: string;
  chunkId?: string;
}

export class QueryService {
  private embeddingService: EmbeddingService;
  private llmService: LlmService;
  private bm25Service: Bm25Service;
  private rerankerService: RerankerService;
  private queryRewriterService: QueryRewriterService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.llmService = new LlmService();
    this.bm25Service = new Bm25Service();
    this.rerankerService = new RerankerService();
    this.queryRewriterService = new QueryRewriterService();
  }

  /**
   * Execute the full RAG pipeline: rewrite → embed → cache check → hybrid retrieve
   * → threshold guard → LLM generate → cache write → return.
   *
   * @param companyId - Multi-tenant isolation scope.
   * @param params    - Query parameters (query, documentId, topK, includeSources).
   */
  async query(companyId: string, params: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();
    const queryId = uuidv4();

    let { query, documentId, topK, includeSources } = params;

    /* ── Step 0: Query Rewriting (Priority 6) ───────────────────────────
     * If enabled, rewrite ambiguous queries into richer search terms.
     * The rewritten query is used ONLY for retrieval — the original query
     * is preserved for answer generation so the LLM sees the user's real intent. */
    const originalQuery = query;
    query = await this.queryRewriterService.rewrite(query);

    /* ── Step 1: Embedding ──────────────────────────────────────────────
     * Convert the (possibly rewritten) query into a dense vector for
     * cosine similarity search against chunk embeddings. */
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

    /* ── Step 2: Audit log embedding token usage ──────────────────────── */
    await this.logTokenUsage({
      companyId,
      queryId,
      operationType: "embedding",
      model: embeddingModel,
      embeddingTokens,
      totalTokens: embeddingTokens,
      cacheHit: false,
    });

    /* ── Step 3: Semantic Cache Check ────────────────────────────────────
     * Look up semantically similar past queries. If found above the
     * similarityThreshold (default 0.90), return the cached answer directly
     * without any LLM call. */
    const cacheResult = await this.lookupCache(companyId, queryEmbedding, documentId);

    if (cacheResult && cacheResult.similarity >= queryConfig.similarityThreshold) {
      await this.incrementCacheHit(cacheResult.id);

      const processingTime = Date.now() - startTime;

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

    const cacheSimilarity = cacheResult ? cacheResult.similarity : 0;

    /* ── Step 4: Retrieve Chunks ───────────────────────────────────────
     * Two modes (configurable via HYBRID_SEARCH_ENABLED):
     *
     * HYBRID MODE (default, Priority 3):
     *   Vector search (top VECTOR_TOP_K=20) + BM25 keyword search (top BM25_TOP_K=20)
     *   → Merge & deduplicate → Rerank (Priority 4) → Final top RERANK_TOP_K=5
     *
     * VECTOR-ONLY MODE (fallback, original behavior):
     *   Pure cosine similarity against all company chunks. */
    let chunks: ChunkWithSimilarity[];
    if (queryConfig.hybridSearchEnabled) {
      chunks = await this.retrieveHybrid(companyId, query, queryEmbedding, documentId, topK);
    } else {
      chunks = await this.retrieveVectorOnly(companyId, queryEmbedding, documentId, topK);
    }

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

    /* ── Step 5: Hallucination Guard (Priority 5) ─────────────────────
     * If the highest-scoring chunk is below the configurable relevanceThreshold,
     * skip the LLM call entirely and return a safe refusal message.
     * This prevents the model from hallucinating when no good context exists.
     *
     * Set RELEVANCE_THRESHOLD=0.0 (default) to disable this guard. */
    const bestScore = chunks[0].similarity;
    if (bestScore < queryConfig.relevanceThreshold) {
      const processingTime = Date.now() - startTime;
      return {
        answer: "No relevant information was found in the indexed documents.",
        sources: includeSources
          ? chunks.slice(0, topK).map((c) => ({
              documentId: c.document_id,
              filename: c.document_filename || "unknown",
              content: c.content,
              similarity: c.similarity,
            }))
          : [],
        cacheHit: false,
        cacheSimilarity,
        processingTime,
      };
    }

    /* ── Step 6: LLM Answer Generation (Priorities 1 & 2) ──────────────
     * Build structured context chunks with metadata (IDs, filenames, scores)
     * and pass them to the LLM with the enhanced system prompt and reasoning
     * user prompt. Uses the ORIGINAL query (not the rewritten one) so the
     * LLM answers what the user actually asked. */
    const contextChunks: ContextChunk[] = chunks.map((c) => ({
      content: c.content,
      chunkId: c.chunkId,
      documentId: c.document_id,
      documentFilename: c.document_filename,
      similarity: c.similarity,
    }));

    let llmResult;
    try {
      llmResult = await this.llmService.generateAnswer(
        originalQuery,
        contextChunks,
        includeSources,
      );
    } catch (error) {
      logger.error("LLM call failed", { error: (error as Error).message, queryId });
      throw new AppError("Failed to generate answer. Please try again.", 500);
    }

    /* ── Step 7: Audit log LLM completion ─────────────────────────────── */
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

    /* Build source metadata for the response. */
    const sources: SourceResult[] = chunks.map((c) => ({
      documentId: c.document_id,
      filename: c.document_filename || "unknown",
      content: c.content,
      similarity: c.similarity,
    }));

    /* ── Step 8: Write to Semantic Cache (best-effort) ─────────────────
     * Store the query+answer pair for future cache hits. Non-fatal: if
     * cache write fails, the response is still returned successfully. */
    try {
      await this.writeCache({
        companyId,
        documentId: documentId || null,
        question: originalQuery,
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

  /** List audit log entries for a company. Unchanged from original API. */
  async listAuditLogs(companyId: string): Promise<any[]> {
    const auditLogs = await QueryTokenUsage.findAll({
      where: { company_id: companyId },
      order: [["created_at", "DESC"]],
    });
    return auditLogs;
  }

  /* ── Semantic Cache Helpers ──────────────────────────────────────────── */

  /**
   * Look up the most semantically similar cached query using pgvector <=>
   * (cosine distance). Returns the cached answer + sources if found.
   */
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

  /** Increment the hit_count for a cached entry and update last_used_at. */
  private async incrementCacheHit(cacheId: string): Promise<void> {
    await sequelize.query(
      `UPDATE semantic_query_cache
       SET hit_count = hit_count + 1, last_used_at = NOW()
       WHERE id = :cacheId`,
      { replacements: { cacheId }, type: "UPDATE" },
    );
  }

  /**
   * Write a new entry to the semantic cache. The embedding is stored as a
   * pgvector VECTOR(1536) for efficient HNSW-indexed similarity lookups.
   */
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

  /* ── Hybrid Retrieval Pipeline (Priority 3 + Priority 4) ─────────────── */

  /**
   * Hybrid retrieval: vector search + BM25 + merge + deduplicate + rerank.
   *
   * Pipeline:
   *   1. Vector search (dense): top VECTOR_TOP_K (default 20) candidates
   *   2. BM25 keyword search (sparse): top BM25_TOP_K (default 20) candidates
   *   3. Merge results into a single list, deduplicate by chunk identity
   *   4. Rerank all candidates → final top RERANK_TOP_K (default 5)
   *   5. Return final results
   *
   * Each step has graceful fallback: if BM25 or reranker fails, the pipeline
   * continues with the results available so far.
   */
  private async retrieveHybrid(
    companyId: string,
    query: string,
    queryEmbedding: number[],
    documentId: string | undefined,
    topK: number,
  ): Promise<ChunkWithSimilarity[]> {
    /* Step 1: Dense vector retrieval — cosine similarity against chunk embeddings. */
    const vectorResults = await this.retrieveVectorOnly(
      companyId,
      queryEmbedding,
      documentId,
      queryConfig.vectorTopK,
    );

    /* Step 2: Sparse keyword retrieval — PostgreSQL full-text search (BM25-like). */
    let bm25Results: Bm25Result[] = [];
    try {
      bm25Results = await this.bm25Service.search(query, companyId, documentId, queryConfig.bm25TopK);
    } catch (error) {
      logger.warn("BM25 search failed, using vector-only results", {
        error: (error as Error).message,
      });
    }

    /* Step 3: Merge and deduplicate — combine vector and BM25 results.
     * Deduplication ensures the same chunk doesn't appear twice even if
     * both retrievers returned it. */
    const seen = new Set<string>();
    const merged: RerankItem[] = [];

    for (const v of vectorResults) {
      const id = v.chunkId || `${v.document_id}|${v.content.substring(0, 100)}`;
      seen.add(id);
      merged.push({
        chunkId: id,
        documentId: v.document_id,
        content: v.content,
        score: v.similarity,
        documentFilename: v.document_filename,
        vectorSimilarity: v.similarity,
      });
    }

    for (const b of bm25Results) {
      const id = b.chunkId || `${b.documentId}|${b.content.substring(0, 100)}`;
      if (!seen.has(id)) {
        seen.add(id);
        merged.push({
          chunkId: id,
          documentId: b.documentId,
          content: b.content,
          score: b.score,
          documentFilename: b.documentFilename,
          bm25Score: b.score,
        });
      }
    }

    /* Step 4: Rerank — apply cross-encoder or score fusion to get the
     * highest-quality results. Falls back to simple sort by score if
     * the reranker itself fails. */
    let reranked: RerankerResult[];
    try {
      reranked = await this.rerankerService.rerank(query, merged, queryConfig.rerankTopK);
    } catch (error) {
      logger.warn("Reranking failed, using score fusion directly", {
        error: (error as Error).message,
      });
      reranked = merged
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((m) => ({
          chunkId: m.chunkId,
          documentId: m.documentId,
          content: m.content,
          score: m.score,
          documentFilename: m.documentFilename,
        }));
    }

    /* Step 5: Limit to requested topK and convert to internal format. */
    return reranked.slice(0, topK).map((r) => ({
      document_id: r.documentId,
      content: r.content,
      similarity: r.score,
      document_filename: r.documentFilename,
      chunkId: r.chunkId,
    }));
  }

  /* ── Vector-Only Retrieval (original behavior, preserved) ────────────────── */

  /**
   * Original retrieval method: load all chunks for a company, compute
   * cosine similarity in-memory, return top K. This is preserved for
   * backward compatibility when HYBRID_SEARCH_ENABLED=false.
   */
  private async retrieveVectorOnly(
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
        chunkId: chunk.id,
      });
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Standard cosine similarity between two vectors.
   * Returns 0 for orthogonal vectors, 0 for empty/zero vectors, 1 for identical.
   */
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

  /* ── Audit Logging ─────────────────────────────────────────────────────── */

  /**
   * Record token usage for embedding and LLM operations.
   * Used for billing, monitoring, and debugging.
   */
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

  /** Rough token estimate: ~4 characters per token. */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export default QueryService;
