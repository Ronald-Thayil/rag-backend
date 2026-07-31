import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn(
      "semantic_query_cache",
      "reference_semantic_id",
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "semantic_query_cache",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    );
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn(
      "semantic_query_cache",
      "reference_semantic_id",
    );
  },
};
