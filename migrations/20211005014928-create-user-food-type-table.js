'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserFoodTypeTables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
      },
      BrandName: {
        type: Sequelize.STRING
      },
      KoreaName: {
        type: Sequelize.STRING
      },
      EnglishName: {
        type: Sequelize.STRING
      },
      PerProtine: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      PerFat: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      Carbohydrate: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      Calorie: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.dropTable('UserFoodTypeTables');
  }
};