export const embeddingConfig = {
  provider: process.env.EMBEDDING_PROVIDER || "openai",
  model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY || "",
  batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || "50", 10),
  rateLimitMs: parseInt(process.env.EMBEDDING_RATE_LIMIT_MS || "100", 10),
  maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || "3", 10),
};

export const chunkConfig = {
  tokenLimit: parseInt(process.env.CHUNK_TOKEN_LIMIT || "1000", 10),
  overlapPercent: parseInt(process.env.CHUNK_OVERLAP_PERCENT || "15", 10),
  minTokens: parseInt(process.env.CHUNK_MIN_TOKENS || "50", 10),
  maxTokens: parseInt(process.env.CHUNK_MAX_TOKENS || "2000", 10),
};

export const uploadConfig = {
  maxFileSizeMb: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "50", 10),
  allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || "pdf,docx,xlsx,xls").split(","),
  tempDir: process.env.UPLOAD_TEMP_DIR || "/tmp/documents",
};

export const queryConfig = {
  similarityThreshold: parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD || "0.90"),
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
};
