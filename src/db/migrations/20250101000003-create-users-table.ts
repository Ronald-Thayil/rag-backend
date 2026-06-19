import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("users", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "member",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: "TIMESTAMPTZ",
        allowNull: true,
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

    await queryInterface.addConstraint("users", {
      type: "unique",
      name: "unique_company_email",
      fields: ["company_id", "email"],
    });

    await queryInterface.addConstraint("users", {
      type: "check",
      name: "valid_role",
      fields: [],
      where: {
        role: ["member", "company_admin"],
      },
    });

    // Users: company-isolated
    await queryInterface.sequelize.query(`
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS users_company_isolation ON users;
      CREATE POLICY users_company_isolation ON users
        FOR ALL
        USING (company_id = app.current_company_id());
    `);

    await queryInterface.addIndex("users", ["company_id"], {
      name: "idx_users_company_id",
    });
    await queryInterface.addIndex("users", ["email"], {
      name: "idx_users_email",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeConstraint("users", "valid_role");
    await queryInterface.removeConstraint("users", "unique_company_email");
    await queryInterface.sequelize.query(`
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.removeIndex("users", "idx_users_email");
    await queryInterface.removeIndex("users", "idx_users_company_id");
    await queryInterface.dropTable("users");
  },
};
