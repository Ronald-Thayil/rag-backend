/**
 * Query Rewriting Service
 *
 * Before retrieval, optionally rewrites ambiguous or underspecified user queries
 * into richer, more specific search queries. This improves retrieval quality
 * because the embedding model and BM25 keyword search both benefit from
 * well-formed, specific queries.
 *
 * Example:
 *   User: "How does bulk compare with monolayer?"
 *   Rewritten: "Compare monolayer-to-few-layer 2D materials with bulk/polycrystalline
 *               2D materials focusing on applications, technology readiness, value chain,
 *               and end users."
 *
 * The rewritten query is used ONLY for retrieval — the original query is still
 * passed to the LLM for answer generation. This ensures the user's intent is
 * preserved while getting better search results.
 *
 * Configuration:
 *   QUERY_REWRITING_ENABLED=true|false (default: false)
 *   QUERY_REWRITER_MODEL=...           (defaults to LLM_MODEL)
 */
import OpenAI from "openai";
import { embeddingConfig, queryConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

export class QueryRewriterService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: embeddingConfig.apiKey });
    this.model = queryConfig.queryRewriterModel;
  }

  /**
   * Rewrite a user query for better retrieval. Returns the original query
   * unchanged if rewriting is disabled or fails.
   */
  async rewrite(query: string): Promise<string> {
    if (!queryConfig.queryRewritingEnabled) {
      return query;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a query rewriting assistant for a RAG system.
Your task is to rewrite ambiguous or underspecified user queries into richer, more specific search queries that will retrieve better results from a document database.

Rules:
1. Preserve the original intent and meaning.
2. Expand abbreviations and acronyms.
3. Add synonyms and related terms.
4. If the query is about comparisons, make the comparison explicit.
5. If the query mentions specific terms, include related field-specific terminology.
6. Output ONLY the rewritten query — no explanations, no labels.
7. Keep the rewritten query concise (under 100 words).
8. If the query is already specific and unambiguous, return it unchanged.`,
          },
          {
            role: "user",
            content: `Rewrite this search query for better document retrieval:\n\n${query}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      });

      const rewritten = response.choices[0]?.message?.content?.trim() || query;
      logger.debug("Query rewritten", { original: query, rewritten });
      return rewritten;
    } catch (error) {
      /* Non-failure: if rewriting fails, just use the original query. */
      logger.warn("Query rewriting failed, using original", {
        error: (error as Error).message,
        query,
      });
      return query;
    }
  }
}

export default QueryRewriterService;
