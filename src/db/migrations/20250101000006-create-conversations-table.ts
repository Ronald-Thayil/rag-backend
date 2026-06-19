import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("conversations", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: { type: DataTypes.STRING(500), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
    });

    await queryInterface.addIndex("conversations", ["tenant_id"], { name: "idx_conv_tenant_id" });
    await queryInterface.addIndex("conversations", ["created_by"], { name: "idx_conv_created_by" });
    await queryInterface.addIndex("conversations", ["updated_by"], { name: "idx_conv_updated_by" });
    await queryInterface.addIndex("conversations", ["deleted_by"], { name: "idx_conv_deleted_by" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("conversations", "idx_conv_deleted_by");
    await queryInterface.removeIndex("conversations", "idx_conv_updated_by");
    await queryInterface.removeIndex("conversations", "idx_conv_created_by");
    await queryInterface.removeIndex("conversations", "idx_conv_tenant_id");
    await queryInterface.dropTable("conversations");
  },
};
