import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("embeddings", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      chunk_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "document_chunks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      embedding: { type: DataTypes.TEXT, allowNull: true },
      model: { type: DataTypes.STRING(100), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
    });

    await queryInterface.addIndex("embeddings", ["chunk_id"], { name: "idx_embeddings_chunk_id" });
    await queryInterface.addIndex("embeddings", ["tenant_id"], { name: "idx_embeddings_tenant_id" });
    await queryInterface.addIndex("embeddings", ["created_by"], { name: "idx_embeddings_created_by" });
    await queryInterface.addIndex("embeddings", ["updated_by"], { name: "idx_embeddings_updated_by" });
    await queryInterface.addIndex("embeddings", ["deleted_by"], { name: "idx_embeddings_deleted_by" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("embeddings", "idx_embeddings_deleted_by");
    await queryInterface.removeIndex("embeddings", "idx_embeddings_updated_by");
    await queryInterface.removeIndex("embeddings", "idx_embeddings_created_by");
    await queryInterface.removeIndex("embeddings", "idx_embeddings_tenant_id");
    await queryInterface.removeIndex("embeddings", "idx_embeddings_chunk_id");
    await queryInterface.dropTable("embeddings");
  },
};
