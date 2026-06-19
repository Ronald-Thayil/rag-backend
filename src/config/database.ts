import { Sequelize } from "sequelize-typescript";
import { env } from "@/config/env";

import { Tenant } from "@/modules/tenants/tenant.model";
import { User } from "@/modules/users/user.model";

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
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
    ],
  },
  models: [Tenant, User],
});
