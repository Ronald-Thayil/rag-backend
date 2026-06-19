import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "rag_db",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASS: process.env.DB_PASS || "",
};

const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
