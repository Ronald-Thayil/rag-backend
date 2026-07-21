/**
 * BM25 Keyword Search Service
 *
 * Implements keyword-based retrieval using PostgreSQL's built-in full-text search.
 * Uses `to_tsvector` / `ts_rank` to score chunks by lexical relevance to the query.
 * This is the "sparse" half of the hybrid retrieval pipeline (dense = vector search).
 *
 * Why PostgreSQL FTS instead of a separate BM25 library?
 * - Zero additional dependencies — built into PostgreSQL.
 * - Multi-tenant isolation works naturally via company_id filter.
 * - `ts_rank` provides relevance scoring comparable to BM25.
 *
 * Configuration: BM25_TOP_K env var (default 20 candidates).
 */
import { sequelize } from "@/config/database";
import { queryConfig } from "@/config/embedding";
import { logger } from "@/config/logger";

/** Result shape returned by BM25 search, including score and document metadata. */
export interface Bm25Result {
  chunkId: string;
  documentId: string;
  content: string;
  /** ts_rank relevance score from PostgreSQL (higher = more relevant). */
  score: number;
  documentFilename: string;
}

export class Bm25Service {
  /**
   * Perform BM25 keyword search against chunk content.
   *
   * @param query     - Raw user query (will be parsed into tsquery tokens).
   * @param companyId - Multi-tenant isolation filter.
   * @param documentId - Optional: scope search to a single document.
   * @param topK     - Number of top results to return.
   */
  async search(
    query: string,
    companyId: string,
    documentId?: string,
    topK: number = queryConfig.bm25TopK,
  ): Promise<Bm25Result[]> {
    /* Build the PostgreSQL full-text search expression.
     * plainto_tsquery converts the raw query string into tsquery tokens,
     * handling stemming and stop-word removal automatically. */
    const tsquery = sequelize.getDialect() === "postgres"
      ? `plainto_tsquery('english', :query)`
      : `plainto_tsquery('english', :query)`;

    /* Build WHERE clause with company isolation and optional document filter. */
    const whereClause = `
      c.company_id = :companyId
      AND c.embedding IS NOT NULL
      ${documentId ? "AND c.document_id = :documentId::UUID" : ""}
    `;

    /* Full query: join chunks with documents, compute ts_rank,
     * filter by ts_vector @@ tsquery match, order by relevance. */
    const sql = `
      SELECT
        c.id AS "chunkId",
        c.document_id AS "documentId",
        c.content,
        ts_rank(to_tsvector('english', c.content), ${tsquery}) AS score,
        d.original_filename AS "documentFilename"
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE ${whereClause}
        AND to_tsvector('english', c.content) @@ ${tsquery}
      ORDER BY score DESC
      LIMIT :topK
    `;

    try {
      const results = await sequelize.query(sql, {
        replacements: { query, companyId, documentId: documentId || null, topK },
        type: "SELECT",
      });

      return (results as any[]).map((row) => ({
        chunkId: row.chunkId,
        documentId: row.documentId,
        content: row.content,
        score: parseFloat(row.score) || 0,
        documentFilename: row.documentFilename || "unknown",
      }));
    } catch (error) {
      /* BM25 failure is non-fatal: caller will fall back to vector-only results. */
      logger.error("BM25 search failed", { error: (error as Error).message, query });
      return [];
    }
  }
}

export default Bm25Service;
