import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("admins", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: "TIMESTAMPTZ",
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

    await queryInterface.addIndex("admins", ["email"], {
      name: "idx_admins_email",
      unique: true,
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("admins", "idx_admins_email");
    await queryInterface.dropTable("admins");
  },
};
