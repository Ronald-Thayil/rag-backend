import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("documents", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: { type: DataTypes.STRING(500), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: true },
      file_path: { type: DataTypes.TEXT, allowNull: true },
      file_type: { type: DataTypes.STRING(50), allowNull: true },
      file_size: { type: DataTypes.INTEGER, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
    });

    await queryInterface.addIndex("documents", ["tenant_id"], { name: "idx_documents_tenant_id" });
    await queryInterface.addIndex("documents", ["created_by"], { name: "idx_documents_created_by" });
    await queryInterface.addIndex("documents", ["updated_by"], { name: "idx_documents_updated_by" });
    await queryInterface.addIndex("documents", ["deleted_by"], { name: "idx_documents_deleted_by" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("documents", "idx_documents_deleted_by");
    await queryInterface.removeIndex("documents", "idx_documents_updated_by");
    await queryInterface.removeIndex("documents", "idx_documents_created_by");
    await queryInterface.removeIndex("documents", "idx_documents_tenant_id");
    await queryInterface.dropTable("documents");
  },
};
