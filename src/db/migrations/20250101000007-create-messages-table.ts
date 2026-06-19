import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("messages", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "conversations", key: "id" },
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
      role: { type: DataTypes.STRING(20), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.UUID, allowNull: true },
      updated_by: { type: DataTypes.UUID, allowNull: true },
      deleted_by: { type: DataTypes.UUID, allowNull: true },
    });

    await queryInterface.addIndex("messages", ["conversation_id"], { name: "idx_messages_conversation_id" });
    await queryInterface.addIndex("messages", ["tenant_id"], { name: "idx_messages_tenant_id" });
    await queryInterface.addIndex("messages", ["created_by"], { name: "idx_messages_created_by" });
    await queryInterface.addIndex("messages", ["updated_by"], { name: "idx_messages_updated_by" });
    await queryInterface.addIndex("messages", ["deleted_by"], { name: "idx_messages_deleted_by" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("messages", "idx_messages_deleted_by");
    await queryInterface.removeIndex("messages", "idx_messages_updated_by");
    await queryInterface.removeIndex("messages", "idx_messages_created_by");
    await queryInterface.removeIndex("messages", "idx_messages_tenant_id");
    await queryInterface.removeIndex("messages", "idx_messages_conversation_id");
    await queryInterface.dropTable("messages");
  },
};
