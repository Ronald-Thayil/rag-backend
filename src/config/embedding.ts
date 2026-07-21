/**
 * Application Configuration
 *
 * Central config loaded from environment variables. All values have sensible
 * defaults so the system runs out-of-the-box with minimal configuration.
 *
 * Config sections:
 *   embeddingConfig — OpenAI embedding provider settings
 *   chunkConfig     — Document chunking parameters
 *   uploadConfig    — File upload validation rules
 *   queryConfig     — RAG query pipeline settings (hybrid search, reranking,
 *                     query rewriting, hallucination guard, evaluation)
 */

/**
 * Embedding provider settings. Controls how document chunks and queries
 * are converted into dense vector representations.
 */
export const embeddingConfig = {
  provider: process.env.EMBEDDING_PROVIDER || "openai",
  model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY || "",
  batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || "50", 10),
  rateLimitMs: parseInt(process.env.EMBEDDING_RATE_LIMIT_MS || "100", 10),
  maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || "3", 10),
};

/**
 * Document chunking configuration.
 * Controls how parsed document text is split into chunks for embedding and retrieval.
 */
export const chunkConfig = {
  tokenLimit: parseInt(process.env.CHUNK_TOKEN_LIMIT || "1000", 10),
  overlapPercent: parseInt(process.env.CHUNK_OVERLAP_PERCENT || "15", 10),
  minTokens: parseInt(process.env.CHUNK_MIN_TOKENS || "50", 10),
  maxTokens: parseInt(process.env.CHUNK_MAX_TOKENS || "2000", 10),
};

/**
 * File upload validation configuration.
 */
export const uploadConfig = {
  maxFileSizeMb: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "50", 10),
  allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || "pdf,docx,xlsx,xls").split(","),
  tempDir: process.env.UPLOAD_TEMP_DIR || "/tmp/documents",
};

/**
 * RAG query pipeline configuration.
 *
 * This is where the improvements from all 7 priorities converge:
 *
 * Priority 3 — Hybrid Search:
 *   hybridSearchEnabled, vectorTopK, bm25TopK, rerankTopK
 *
 * Priority 4 — Reranking:
 *   rerankerProvider, rerankerModel, rerankerApiKey
 *
 * Priority 5 — Hallucination Guard:
 *   relevanceThreshold (skip LLM if best score below this)
 *
 * Priority 6 — Query Rewriting:
 *   queryRewritingEnabled, queryRewriterModel
 *
 * Priority 7 — Evaluation:
 *   evaluationEnabled
 */
export const queryConfig = {
  similarityThreshold: parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD || "0.90"),
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
  hybridSearchEnabled: process.env.HYBRID_SEARCH_ENABLED !== "false",
  vectorTopK: parseInt(process.env.VECTOR_TOP_K || "20", 10),
  bm25TopK: parseInt(process.env.BM25_TOP_K || "20", 10),
  rerankTopK: parseInt(process.env.RERANK_TOP_K || "5", 10),
  relevanceThreshold: parseFloat(process.env.RELEVANCE_THRESHOLD || "0.0"),
  rerankerProvider: process.env.RERANKER_PROVIDER || "none",
  rerankerModel: process.env.RERANKER_MODEL || "cohere",
  rerankerApiKey: process.env.COHERE_API_KEY || "",
  queryRewritingEnabled: process.env.QUERY_REWRITING_ENABLED === "true",
  queryRewriterModel: process.env.QUERY_REWRITER_MODEL || process.env.LLM_MODEL || "gpt-4o-mini",
  evaluationEnabled: process.env.EVALUATION_ENABLED === "true",
};
