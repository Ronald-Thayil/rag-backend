export const DB_HOST = process.env.DB_HOST || "127.0.0.1";
export const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
export const DB_USERNAME =
  process.env.DB_USER || process.env.DB_USERNAME || "postgres";
export const DB_PASSWORD = process.env.DB_PASS || process.env.DB_PASSWORD || "";
export const DB_NAME = process.env.DB_NAME || "rag_db";
