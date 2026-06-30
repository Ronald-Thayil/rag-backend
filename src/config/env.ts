import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),

  // Database
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "rag_db",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASS: process.env.DB_PASS || "",

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access-secret-dev",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-secret-dev",
  JWT_ACCESS_EXPIRES_IN: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || "900", 10),     // 15 min
  JWT_REFRESH_EXPIRES_IN: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "604800", 10), // 7 days

  // Cookies
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  COOKIE_SECURE: process.env.NODE_ENV === "production",

  // Redis / Queue
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // Upload
  UPLOAD_MAX_FILE_SIZE_MB: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "50", 10),
  UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES || "pdf,docx,xlsx,xls",

  // Chunking
  CHUNK_TOKEN_LIMIT: parseInt(process.env.CHUNK_TOKEN_LIMIT || "1000", 10),
  CHUNK_OVERLAP_PERCENT: parseInt(process.env.CHUNK_OVERLAP_PERCENT || "15", 10),

  // Embedding
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || "openai",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  EMBEDDING_BATCH_SIZE: parseInt(process.env.EMBEDDING_BATCH_SIZE || "50", 10),
  EMBEDDING_RATE_LIMIT_MS: parseInt(process.env.EMBEDDING_RATE_LIMIT_MS || "100", 10),

  // Job Queue
  JOB_TIMEOUT_SECONDS: parseInt(process.env.JOB_TIMEOUT_SECONDS || "300", 10),
  JOB_MAX_ATTEMPTS: parseInt(process.env.JOB_MAX_ATTEMPTS || "3", 10),
};

const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
