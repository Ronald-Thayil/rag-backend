import dotenv from "dotenv";
dotenv.config();

import app from "@/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { sequelize } from "@/config/database";
import { registerDocumentProcessor } from "@/jobs/document-processing.job";

async function main() {
  try {
    await sequelize.authenticate();
    logger.info("Database connected successfully");

    registerDocumentProcessor();
    logger.info("Document processing worker registered");

    app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error as Error);
    process.exit(1);
  }
}

main();
