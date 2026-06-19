import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("documents", {
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
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      filename: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      original_filename: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_size_bytes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storage_path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "processing",
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      chunk_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
    });

    await queryInterface.addConstraint("documents", {
      type: "check",
      name: "valid_file_type",
      fields: [],
      where: {
        file_type: ["pdf", "docx", "xlsx", "csv"],
      },
    });

    await queryInterface.addConstraint("documents", {
      type: "check",
      name: "valid_status",
      fields: [],
      where: {
        status: ["processing", "ready", "failed", "deleted"],
      },
    });

    // Documents: company-isolated
    await queryInterface.sequelize.query(`
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS documents_company_isolation ON documents;
      CREATE POLICY documents_company_isolation ON documents
        FOR ALL
        USING (company_id = app.current_company_id());
    `);

    await queryInterface.addIndex("documents", ["company_id"], {
      name: "idx_documents_company_id",
    });
    await queryInterface.addIndex("documents", ["status"], {
      name: "idx_documents_status",
    });
    await queryInterface.addIndex("documents", ["uploaded_by"], {
      name: "idx_documents_uploaded_by",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeConstraint("documents", "valid_status");
    await queryInterface.removeConstraint("documents", "valid_file_type");
    await queryInterface.sequelize.query(`
      ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.removeIndex("documents", "idx_documents_uploaded_by");
    await queryInterface.removeIndex("documents", "idx_documents_status");
    await queryInterface.removeIndex("documents", "idx_documents_company_id");
    await queryInterface.dropTable("documents");
  },
};
