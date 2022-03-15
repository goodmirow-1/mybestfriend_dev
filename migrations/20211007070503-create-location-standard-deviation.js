'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationStandardDeviations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Location: {
        type: Sequelize.STRING
      },
      FoodStandardDeviation: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      FoodAverage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      WaterStandardDeviation: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      WaterAverage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      WeightStandardDeviation: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      WeightAverage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LocationStandardDeviations');
  }
};