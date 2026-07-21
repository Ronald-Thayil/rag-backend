/**
 * Reranking Service
 *
 * Improves retrieval quality by re-scoring candidate chunks after hybrid search.
 * Two implementations are provided (both implementing the IReranker interface):
 *
 * 1. ScoreFusionReranker (default, no external API needed)
 *    - Averages normalized vector similarity and BM25 scores.
 *    - BM25 scores are normalized via: 1 - 1/(1 + score) to map [0, ∞) → [0, 1).
 *    - Fast, local, no dependencies.
 *
 * 2. CohereReranker (optional, requires COHERE_API_KEY)
 *    - Calls Cohere's /rerank API with a cross-encoder model.
 *    - More accurate than score fusion because it evaluates query-document pairs jointly.
 *    - Falls back to ScoreFusionReranker on API failure.
 *
 * Configuration:
 *   RERANKER_PROVIDER=none|cohere
 *   COHERE_API_KEY=...          (required if provider=cohere)
 *   RERANKER_MODEL=rerank-english-v3.0
 *   RERANK_TOP_K=5              (final number of chunks returned to LLM)
 */
import { queryConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

/** A candidate chunk from hybrid search before reranking. */
export interface RerankItem {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  documentFilename: string;
  vectorSimilarity?: number;
  bm25Score?: number;
}

/** A chunk after reranking with its final relevance score. */
export interface RerankerResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  documentFilename: string;
}

/** Pluggable reranker interface — any reranker must implement this. */
export interface IReranker {
  rerank(query: string, candidates: RerankItem[], topK: number): Promise<RerankerResult[]>;
}

/**
 * Default reranker: fuses vector similarity and BM25 scores via simple averaging.
 * No external API calls, works offline, zero latency.
 */
export class ScoreFusionReranker implements IReranker {
  async rerank(query: string, candidates: RerankItem[], topK: number): Promise<RerankerResult[]> {
    if (candidates.length === 0) return [];

    const hasVector = candidates.some((c) => c.vectorSimilarity !== undefined);
    const hasBm25 = candidates.some((c) => c.bm25Score !== undefined);

    const scored = candidates.map((item) => {
      let combined = 0;
      let weight = 0;

      if (hasVector && item.vectorSimilarity !== undefined) {
        combined += item.vectorSimilarity;
        weight += 1;
      }
      if (hasBm25 && item.bm25Score !== undefined) {
        const normalizedBm25 = this.normalizeBm25(item.bm25Score);
        combined += normalizedBm25;
        weight += 1;
      }

      return {
        chunkId: item.chunkId,
        documentId: item.documentId,
        content: item.content,
        score: weight > 0 ? combined / weight : item.score,
        documentFilename: item.documentFilename,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** Normalize unbounded BM25 scores into [0, 1) range for fair fusion with cosine similarity. */
  private normalizeBm25(score: number): number {
    return 1 - 1 / (1 + score);
  }
}

/**
 * Cross-encoder reranker using Cohere's Rerank API.
 * More accurate than score fusion but requires an API key and incurs latency.
 */
class CohereReranker implements IReranker {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "rerank-english-v3.0") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async rerank(query: string, candidates: RerankItem[], topK: number): Promise<RerankerResult[]> {
    if (candidates.length === 0) return [];

    const docs = candidates.map((c) => c.content);

    try {
      const response = await fetch("https://api.cohere.com/v1/rerank", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          query,
          documents: docs,
          top_n: Math.min(topK, docs.length),
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere rerank failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      /* Map Cohere's response back to our chunk structure using the original index. */
      return data.results.map((r: any) => ({
        chunkId: candidates[r.index].chunkId,
        documentId: candidates[r.index].documentId,
        content: candidates[r.index].content,
        score: r.relevance_score,
        documentFilename: candidates[r.index].documentFilename,
      }));
    } catch (error) {
      logger.error("Cohere reranker failed, falling back to score fusion", {
        error: (error as Error).message,
      });
      const fallback = new ScoreFusionReranker();
      return fallback.rerank(query, candidates, topK);
    }
  }
}

/**
 * Facade service that selects the appropriate reranker implementation
 * based on configuration. Returns top-K reranked results.
 */
export class RerankerService {
  private reranker: IReranker;

  constructor() {
    if (
      queryConfig.rerankerProvider === "cohere" &&
      queryConfig.rerankerApiKey
    ) {
      this.reranker = new CohereReranker(
        queryConfig.rerankerApiKey,
        queryConfig.rerankerModel,
      );
      logger.info("Using Cohere reranker", { model: queryConfig.rerankerModel });
    } else {
      this.reranker = new ScoreFusionReranker();
      logger.info("Using score fusion reranker");
    }
  }

  async rerank(
    query: string,
    candidates: RerankItem[],
    topK: number = queryConfig.rerankTopK,
  ): Promise<RerankerResult[]> {
    return this.reranker.rerank(query, candidates, topK);
  }
}

export default RerankerService;
