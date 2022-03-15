'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Pets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        references: {
          model : 'Users',
          key : 'UserID',
        },
      },
      Index: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Type: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Name: {
        type: Sequelize.STRING
      },
      Birthday: {
        type: Sequelize.STRING
      },
      Kind: {
        type: Sequelize.STRING
      },
      Weight: {
        type: Sequelize.DOUBLE
      },
      Sex: {
        type: Sequelize.INTEGER
      },
      PregnantState : {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      ObesityState : {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Disease: {
        type: Sequelize.STRING,
        defaultValue : ''
      },
      Allergy: {
        type: Sequelize.STRING,
        defaultValue : ''
      },
      FoodID: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      FoodCalorie: {
        type: Sequelize.INTEGER,
        defaultValue : 3784     //강아지 사료의 기본 kcal
      },
      FoodWater: {
        type: Sequelize.INTEGER,
        defaultValue : 0.12
      },
      FoodRecommendedIntake: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      WaterRecommendedIntake: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      WeightRecommended: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
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
    await queryInterface.dropTable('Pets');
  }
};