import { QueryInterface } from "sequelize";

/*
  RLS policies for multi-tenant isolation:
    - companies:  only visible to platform admins (app.current_admin_id)
    - users:      company-isolated via app.current_company_id
    - documents:  company-isolated via app.current_company_id
    - chunks:     company-isolated via app.current_company_id

  The middleware sets app.current_company_id and app.current_admin_id
  per-request after validating the x-company-id header / auth token.
*/

const RLS_TABLES = [
  { name: "companies", policy: "companies_admin_isolation" },
  { name: "users", policy: "users_company_isolation" },
  { name: "documents", policy: "documents_company_isolation" },
  { name: "chunks", policy: "chunks_company_isolation" },
];

export default {
  async up(queryInterface: QueryInterface) {
    // Helper function: returns the current admin UUID (NULL if not set)

    await queryInterface.sequelize.query(`
    CREATE SCHEMA IF NOT EXISTS app;
  `);
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION app.current_admin_id()
      RETURNS UUID LANGUAGE SQL STABLE AS $$
        SELECT NULLIF(current_setting('app.current_admin_id', true), '')::UUID;
      $$;
    `);

    // Helper function: returns the current company UUID (NULL if not set)
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION app.current_company_id()
      RETURNS UUID LANGUAGE SQL STABLE AS $$
        SELECT NULLIF(current_setting('app.current_company_id', true), '')::UUID;
      $$;
    `);

    // Helper function: returns the current user UUID (NULL if not set)
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION app.current_user_id()
      RETURNS UUID LANGUAGE SQL STABLE AS $$
        SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
      $$;
    `);
  },

  async down(queryInterface: QueryInterface) {

    await queryInterface.sequelize.query(`
    DROP SCHEMA IF EXISTS app CASCADE;
  `);

    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS app.current_admin_id()`,
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS app.current_company_id()`,
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS app.current_user_id()`,
    );
  },
};
