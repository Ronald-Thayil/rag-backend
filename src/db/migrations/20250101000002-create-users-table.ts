import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("users", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "USER",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("users", ["tenant_id"], {
      name: "idx_users_tenant_id",
    });
    await queryInterface.addIndex("users", ["email"], {
      name: "idx_users_email",
      unique: true,
    });
    await queryInterface.addIndex("users", ["role"], {
      name: "idx_users_role",
    });
    await queryInterface.addIndex("users", ["is_active"], {
      name: "idx_users_is_active",
    });
    await queryInterface.addIndex("users", ["created_by"], {
      name: "idx_users_created_by",
    });
    await queryInterface.addIndex("users", ["updated_by"], {
      name: "idx_users_updated_by",
    });
    await queryInterface.addIndex("users", ["deleted_by"], {
      name: "idx_users_deleted_by",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("users", "idx_users_deleted_by");
    await queryInterface.removeIndex("users", "idx_users_updated_by");
    await queryInterface.removeIndex("users", "idx_users_created_by");
    await queryInterface.removeIndex("users", "idx_users_is_active");
    await queryInterface.removeIndex("users", "idx_users_role");
    await queryInterface.removeIndex("users", "idx_users_email");
    await queryInterface.removeIndex("users", "idx_users_tenant_id");
    await queryInterface.dropTable("users");
  },
};
