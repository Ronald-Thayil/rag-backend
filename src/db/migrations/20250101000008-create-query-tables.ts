import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryInterface.createTable("query_token_usage", {
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
      query_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      operation_type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      model: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      embedding_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      prompt_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      completion_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_tokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cache_hit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint("query_token_usage", {
      type: "check",
      name: "valid_operation_type",
      fields: [],
      where: {
        operation_type: ["embedding", "llm_completion"],
      },
    });

    await queryInterface.addIndex("query_token_usage", ["company_id"], {
      name: "idx_query_token_usage_company_id",
    });
    await queryInterface.addIndex("query_token_usage", ["created_at"], {
      name: "idx_query_token_usage_created_at",
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE query_token_usage ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS query_token_usage_isolation ON query_token_usage;
      CREATE POLICY query_token_usage_isolation ON query_token_usage
        FOR ALL
        USING (company_id = app.current_company_id());
    `);

    await queryInterface.createTable("semantic_query_cache", {
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
        allowNull: true,
        references: { model: "documents", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_embedding: {
        type: "VECTOR(1536)",
        allowNull: false,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sources: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      hit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      last_used_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    });

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_semantic_cache_hnsw
        ON semantic_query_cache
        USING hnsw (question_embedding vector_cosine_ops);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE semantic_query_cache ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS semantic_query_cache_isolation ON semantic_query_cache;
      CREATE POLICY semantic_query_cache_isolation ON semantic_query_cache
        FOR ALL
        USING (company_id = app.current_company_id());
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_semantic_cache_hnsw;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE semantic_query_cache DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.dropTable("semantic_query_cache");

    await queryInterface.removeConstraint("query_token_usage", "valid_operation_type");

    await queryInterface.removeIndex("query_token_usage", "idx_query_token_usage_created_at");
    await queryInterface.removeIndex("query_token_usage", "idx_query_token_usage_company_id");

    await queryInterface.sequelize.query(`
      ALTER TABLE query_token_usage DISABLE ROW LEVEL SECURITY;
    `);
    await queryInterface.dropTable("query_token_usage");
  },
};
