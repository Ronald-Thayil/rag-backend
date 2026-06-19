import fs from "fs";
import path from "path";
import { logger } from "@/shared/utils/request-logger";

const seederName = process.argv[2];
if (!seederName) {
  logger.error("Please provide a migration name");
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -3);
const filename = `${timestamp}-${seederName}.ts`;

const template = `import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    
  },

  async down(queryInterface: QueryInterface) {
   
  },
};
`;

fs.writeFileSync(path.join(__dirname, `/seeders/${filename}`), template);
logger.info(`Created Seeder File: ${filename}`);
