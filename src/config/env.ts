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
};

const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
