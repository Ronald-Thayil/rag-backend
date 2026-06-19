import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("tenants", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("tenants", ["slug"], {
      name: "idx_tenants_slug",
      unique: true,
    });
    await queryInterface.addIndex("tenants", ["is_active"], {
      name: "idx_tenants_is_active",
    });
    await queryInterface.addIndex("tenants", ["created_by"], {
      name: "idx_tenants_created_by",
    });
    await queryInterface.addIndex("tenants", ["updated_by"], {
      name: "idx_tenants_updated_by",
    });
    await queryInterface.addIndex("tenants", ["deleted_by"], {
      name: "idx_tenants_deleted_by",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("tenants", "idx_tenants_deleted_by");
    await queryInterface.removeIndex("tenants", "idx_tenants_updated_by");
    await queryInterface.removeIndex("tenants", "idx_tenants_created_by");
    await queryInterface.removeIndex("tenants", "idx_tenants_is_active");
    await queryInterface.removeIndex("tenants", "idx_tenants_slug");
    await queryInterface.dropTable("tenants");
  },
};
