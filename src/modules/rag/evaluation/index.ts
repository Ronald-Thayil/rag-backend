/**
 * RAG Evaluation Module (Priority 7)
 *
 * Provides quantitative metrics for assessing RAG pipeline quality.
 * Two categories of metrics:
 *
 * RETRIEVAL METRICS:
 *   - Recall@5 / Recall@10  — Proportion of relevant chunks in top K retrieved.
 *   - MRR (Mean Reciprocal Rank) — How early the first relevant chunk appears.
 *   - Hit Rate — Whether at least one relevant chunk was retrieved.
 *
 * GENERATION METRICS:
 *   - Groundedness — Proportion of claims supported by source context.
 *   - Faithfulness — Whether the answer contradicts the context.
 *   - Citation Coverage — Proportion of claims that include a citation.
 *
 * Usage:
 *   const evalService = new EvaluationService();
 *   const metrics = evalService.evaluateSample({
 *     query: "...",
 *     relevantChunkIds: ["chunk-a", "chunk-b"],
 *     retrievedChunkIds: ["chunk-b", "chunk-c", "chunk-d"],
 *     answer: "...",
 *     contextChunks: [...],
 *   });
 *
 *   const avgMetrics = evalService.evaluateBatch(samples);
 */
import { logger } from "@/config/logger";

/**
 * A single evaluation sample containing everything needed to compute
 * both retrieval and generation metrics.
 */
export interface EvalSample {
  query: string;
  /** Ground-truth set of relevant chunk IDs for this query. */
  relevantChunkIds: string[];
  /** Ordered list of chunk IDs as returned by the retriever. */
  retrievedChunkIds: string[];
  /** Similarity scores corresponding to retrievedChunkIds. */
  retrievedScores: number[];
  /** The LLM-generated answer. */
  answer: string;
  /** Optional: ideal answer for reference. */
  groundTruthAnswer?: string;
  /** The context chunks provided to the LLM (for groundedness checks). */
  contextChunks: { chunkId: string; content: string }[];
  /** List of citations extracted from the answer. */
  citations?: string[];
}

/** All computed evaluation metrics. */
export interface EvalMetrics {
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  hitRate: number;
  groundedness: number;
  faithfulness: number;
  citationCoverage: number;
}

export class EvaluationService {
  /**
   * Compute all retrieval and generation metrics for a single sample.
   */
  evaluateSample(sample: EvalSample): EvalMetrics {
    const relevant = new Set(sample.relevantChunkIds);
    const retrieved = sample.retrievedChunkIds;

    /* Retrieval metrics */
    const recallAt5 = this.recallAtK(relevant, retrieved, 5);
    const recallAt10 = this.recallAtK(relevant, retrieved, 10);
    const mrr = this.meanReciprocalRank(relevant, retrieved);
    const hitRate = this.hitRate(relevant, retrieved);

    /* Generation metrics */
    const groundedness = this.computeGroundedness(sample.answer, sample.contextChunks);
    const faithfulness = this.computeFaithfulness(sample);
    const citationCoverage = this.computeCitationCoverage(sample);

    return { recallAt5, recallAt10, mrr, hitRate, groundedness, faithfulness, citationCoverage };
  }

  /**
   * Evaluate a batch of samples and return averaged metrics.
   */
  evaluateBatch(samples: EvalSample[]): EvalMetrics {
    if (samples.length === 0) {
      return {
        recallAt5: 0, recallAt10: 0, mrr: 0, hitRate: 0,
        groundedness: 0, faithfulness: 0, citationCoverage: 0,
      };
    }

    let total = { recallAt5: 0, recallAt10: 0, mrr: 0, hitRate: 0, groundedness: 0, faithfulness: 0, citationCoverage: 0 };

    for (const sample of samples) {
      const metrics = this.evaluateSample(sample);
      total.recallAt5 += metrics.recallAt5;
      total.recallAt10 += metrics.recallAt10;
      total.mrr += metrics.mrr;
      total.hitRate += metrics.hitRate;
      total.groundedness += metrics.groundedness;
      total.faithfulness += metrics.faithfulness;
      total.citationCoverage += metrics.citationCoverage;
    }

    const n = samples.length;
    return {
      recallAt5: total.recallAt5 / n,
      recallAt10: total.recallAt10 / n,
      mrr: total.mrr / n,
      hitRate: total.hitRate / n,
      groundedness: total.groundedness / n,
      faithfulness: total.faithfulness / n,
      citationCoverage: total.citationCoverage / n,
    };
  }

  /* ── Retrieval Metrics ────────────────────────────────────────────── */

  /**
   * Recall@K: proportion of relevant documents found among the top K retrieved.
   * Measures how well the retriever captures all relevant information.
   */
  private recallAtK(relevant: Set<string>, retrieved: string[], k: number): number {
    const topK = retrieved.slice(0, k);
    if (topK.length === 0) return 0;
    const hits = topK.filter((id) => relevant.has(id)).length;
    return relevant.size > 0 ? hits / relevant.size : 0;
  }

  /**
   * Mean Reciprocal Rank: 1 / rank of the first relevant document.
   * Measures how early the first good result appears. 0 if none found.
   */
  private meanReciprocalRank(relevant: Set<string>, retrieved: string[]): number {
    for (let i = 0; i < retrieved.length; i++) {
      if (relevant.has(retrieved[i])) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  /**
   * Hit Rate: binary — was at least one relevant document retrieved?
   */
  private hitRate(relevant: Set<string>, retrieved: string[]): number {
    return retrieved.some((id) => relevant.has(id)) ? 1 : 0;
  }

  /* ── Generation Metrics ────────────────────────────────────────────── */

  /**
   * Groundedness: the proportion of claims in the answer that are supported
   * by the source context chunks.
   *
   * Heuristic approach:
   *   1. Split answer into sentences.
   *   2. Filter out trivial sentences (< 4 words).
   *   3. For each remaining sentence, extract content words (excluding stop words).
   *   4. A sentence is "supported" if >= 50% of its content words appear in context.
   *
   * This is a rough approximation. For production, consider using an NLI model
   * or an LLM-as-judge for more accurate groundedness scoring.
   */
  private computeGroundedness(
    answer: string,
    contextChunks: { chunkId: string; content: string }[],
  ): number {
    if (!answer) return 0;
    if (contextChunks.length === 0) return 0;

    const contextText = contextChunks.map((c) => c.content.toLowerCase()).join(" ");
    const sentences = this.splitSentences(answer);

    if (sentences.length === 0) return 1;

    const nonTrivial = sentences.filter(
      (s) => s.split(/\s+/).length >= 4,
    );

    if (nonTrivial.length === 0) return 1;

    const supported = nonTrivial.filter((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const stopWords = new Set([
        "this", "that", "with", "from", "have", "been", "were",
        "what", "when", "where", "which", "their", "there", "about",
        "would", "could", "should", "into", "over", "such", "only",
      ]);
      const contentWords = words.filter((w) => !stopWords.has(w) && /^[a-z]+$/.test(w));
      if (contentWords.length === 0) return true;
      const matchCount = contentWords.filter((w) => contextText.includes(w)).length;
      return matchCount / contentWords.length >= 0.5;
    });

    return supported.length / nonTrivial.length;
  }

  /**
   * Faithfulness: whether the answer contradicts the provided context.
   *
   * Uses groundedness as a proxy (a grounded answer is faithful by definition).
   * Special case: if the model correctly refused to answer (the escape hatch
   * message), faithfulness is automatically 1.0.
   */
  private computeFaithfulness(sample: EvalSample): number {
    if (!sample.answer) return 0;
    /* If model correctly said "can't answer", it's faithful. */
    if (sample.answer.includes("does not contain enough information")) return 1;
    const g = this.computeGroundedness(sample.answer, sample.contextChunks);
    return g;
  }

  /**
   * Citation Coverage: proportion of substantive claims that include
   * a citation marker like [Chunk N] or a document reference.
   *
   * Higher citation coverage means the answer is more auditable and
   * users can verify claims against the source documents.
   */
  private computeCitationCoverage(sample: EvalSample): number {
    if (!sample.answer) return 0;
    const sentences = this.splitSentences(sample.answer);
    if (sentences.length === 0) return 1;

    const nonTrivial = sentences.filter((s) => s.split(/\s+/).length >= 4);
    if (nonTrivial.length === 0) return 1;

    const cited = nonTrivial.filter((s) => {
      const hasCitation = /\[Chunk\s*\d+\]|\(Source:|\(ID:|\[.*?\]/.test(s);
      const hasDocRef = /from\s+["""]?.+?["""]?/.test(s);
      return hasCitation || hasDocRef;
    });

    return cited.length / nonTrivial.length;
  }

  /** Split text into sentences on sentence-ending punctuation. */
  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}

export default EvaluationService;
