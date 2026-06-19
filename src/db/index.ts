import { Sequelize } from "sequelize-typescript";
import { sequelize } from "@/config/database";
import { logger } from "@/config/logger";

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;
  const maxRetries = 5;
  const baseDelay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info("Database connection established");
      isConnected = true;
      return;
    } catch (error) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (attempt === maxRetries) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to connect after ${maxRetries} attempts: ${msg}`);
      }
      logger.warn(`DB connection attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  try {
    await sequelize.close();
    isConnected = false;
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection", error as Error);
    throw error;
  }
}

export function getSequelize(): Sequelize {
  return sequelize;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export { sequelize };
export default sequelize;
