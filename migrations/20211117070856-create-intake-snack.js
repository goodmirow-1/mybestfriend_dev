'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IntakeSnacks', {
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
      SnackID: {
        type: Sequelize.INTEGER
      },
      Amount: {
        type: Sequelize.DOUBLE
      },
      Water: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0
      },
      Calorie: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      Time: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('IntakeSnacks');
  }
};