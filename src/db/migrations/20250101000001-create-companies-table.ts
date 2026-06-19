import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );

    await queryInterface.createTable("companies", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updated_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("companies", ["slug"], {
      name: "idx_companies_slug",
      unique: true,
    });

    // Companies: only visible to authenticated platform admins
    await queryInterface.sequelize.query(`
      ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS companies_admin_isolation ON companies;
      CREATE POLICY companies_admin_isolation ON companies
        FOR ALL
        USING (app.current_admin_id() IS NOT NULL);
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("companies", "idx_companies_slug");
    await queryInterface.sequelize.query(`
      ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.dropTable("companies");
  },
};
