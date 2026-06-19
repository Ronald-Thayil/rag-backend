import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("refresh_tokens", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      token_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      subject_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      subject_type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expires_at: {
        type: "TIMESTAMPTZ",
        allowNull: false,
      },
      revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: "TIMESTAMPTZ",
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("refresh_tokens", ["token_hash"], {
      name: "idx_refresh_tokens_hash",
      unique: true,
    });
    await queryInterface.addIndex("refresh_tokens", ["subject_id", "subject_type"], {
      name: "idx_refresh_tokens_subject",
    });
    await queryInterface.addIndex("refresh_tokens", ["expires_at"], {
      name: "idx_refresh_tokens_expires",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("refresh_tokens", "idx_refresh_tokens_expires");
    await queryInterface.removeIndex("refresh_tokens", "idx_refresh_tokens_subject");
    await queryInterface.removeIndex("refresh_tokens", "idx_refresh_tokens_hash");
    await queryInterface.dropTable("refresh_tokens");
  },
};
