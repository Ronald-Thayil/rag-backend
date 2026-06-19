import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS vector`,
    );

    await queryInterface.createTable("chunks", {
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
      document_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "documents", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      embedding: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      chunk_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      token_count: {
        type: DataTypes.INTEGER,
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
    });

    await queryInterface.addIndex("chunks", ["company_id"], {
      name: "idx_chunks_company_id",
    });
    await queryInterface.addIndex("chunks", ["document_id"], {
      name: "idx_chunks_document_id",
    });
    // Chunks: company-isolated
    await queryInterface.sequelize.query(`
          ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS chunks_company_isolation ON chunks;
          CREATE POLICY chunks_company_isolation ON chunks
            FOR ALL
            USING (company_id = app.current_company_id());
        `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("chunks", "idx_chunks_document_id");
    await queryInterface.removeIndex("chunks", "idx_chunks_company_id");
    await queryInterface.sequelize.query(`
      ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.dropTable("chunks");
  },
};
