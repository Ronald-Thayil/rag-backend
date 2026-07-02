import { Sequelize } from "sequelize-typescript";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

import { Company } from "@/modules/companies/company.model";
import { Admin } from "@/modules/admins/admin.model";
import { User } from "@/modules/users/user.model";
import { Document } from "@/modules/rag/documents/document.model";
import { Chunk } from "@/modules/rag/chunks/chunk.model";
import { RefreshToken } from "@/modules/auth/refresh-token.model";
import { QueryTokenUsage } from "@/modules/rag/query/models/query-token-usage.model";
import { SemanticQueryCache } from "@/modules/rag/query/models/semantic-query-cache.model";

export const sequelize = new Sequelize({
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS || undefined,
  database: env.DB_NAME,
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 15,
    min: 2,
    acquire: 60000,
    idle: 20000,
  },
  retry: {
    max: 5,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ESOCKETTIMEDOUT/,
      /EPIPE/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
    ],
  },
  models: [Company, Admin, User, Document, Chunk, RefreshToken, QueryTokenUsage, SemanticQueryCache],
});

/*
  Reset RLS session variables on every new pool connection.
  This prevents cross-company data leaks when connections are recycled:
    - app.current_company_id → empty
    - app.current_admin_id  → empty
    - app.current_user_id   → empty
  The company.middleware.ts then sets the correct values per-request.
*/
sequelize.addHook("afterConnect", async (connection: any) => {
  await connection.query(`
    SELECT set_config('app.current_company_id', '', true);
    SELECT set_config('app.current_admin_id', '', true);
    SELECT set_config('app.current_user_id', '', true);
  `);
  logger.debug("RLS session context initialized on new DB connection");
});
