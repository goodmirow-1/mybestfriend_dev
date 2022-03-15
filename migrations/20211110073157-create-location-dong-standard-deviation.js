'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationDongStandardDeviations', {
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
      DogWeightStandardDeviation: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      DogWeightAverage: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      CatWeightStandardDeviation: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      CatWeightAverage: {
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
    await queryInterface.dropTable('LocationDongStandardDeviations');
  }
};