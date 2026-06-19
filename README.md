# RAG Backend Test

Minimal TypeScript Node.js project using Express and Sequelize (Postgres). Includes migration/seeder generators and a health endpoint that checks DB connectivity.

Getting started

1. Copy `.env.example` to `.env` and set DB credentials.
2. Install dependencies: npm install
3. Run in dev: npm run dev

Key scripts

- npm run dev: start dev server
- npm run build && npm start: build then run production
- npm run db:migration:generate <name>: create a timestamped migration in `src/db/migrations`
- npm run db:seed:generate <name>: create a seed file in `src/db/seeders`
- sequelize-cli commands (db:migrate, db:seed:all) expect JS compiled files in `dist` (see .sequelizerc)
