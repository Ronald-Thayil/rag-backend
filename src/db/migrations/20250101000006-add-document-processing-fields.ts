import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("documents", "raw_text", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("documents", "page_count", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("documents", "completed_at", {
      type: "TIMESTAMPTZ",
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("documents", "raw_text");
    await queryInterface.removeColumn("documents", "page_count");
    await queryInterface.removeColumn("documents", "completed_at");
  },
};
