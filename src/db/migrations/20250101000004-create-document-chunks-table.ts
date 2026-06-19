import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("document_chunks", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      document_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "documents", key: "id" },
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
      chunk_index: { type: DataTypes.INTEGER, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      token_count: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
    });

    await queryInterface.addIndex("document_chunks", ["document_id"], { name: "idx_chunks_document_id" });
    await queryInterface.addIndex("document_chunks", ["tenant_id"], { name: "idx_chunks_tenant_id" });
    await queryInterface.addIndex("document_chunks", ["created_by"], { name: "idx_chunks_created_by" });
    await queryInterface.addIndex("document_chunks", ["updated_by"], { name: "idx_chunks_updated_by" });
    await queryInterface.addIndex("document_chunks", ["deleted_by"], { name: "idx_chunks_deleted_by" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("document_chunks", "idx_chunks_deleted_by");
    await queryInterface.removeIndex("document_chunks", "idx_chunks_updated_by");
    await queryInterface.removeIndex("document_chunks", "idx_chunks_created_by");
    await queryInterface.removeIndex("document_chunks", "idx_chunks_tenant_id");
    await queryInterface.removeIndex("document_chunks", "idx_chunks_document_id");
    await queryInterface.dropTable("document_chunks");
  },
};
