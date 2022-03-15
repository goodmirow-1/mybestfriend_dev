'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Intakes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      PetID: {
        type: Sequelize.INTEGER,
        references: {
          model : 'Pets',
          key : 'id',
        },
      },
      FoodID : {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      BowlWeight: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      Amount: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      BowlType: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      State: {
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
    await queryInterface.dropTable('Intakes');
  }
};