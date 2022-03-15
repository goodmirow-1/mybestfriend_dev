'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Advice', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Month: {
        type: Sequelize.STRING
      },
      Day: {
        type: Sequelize.STRING
      },
      Contents: {
        type: Sequelize.STRING
      },
      ContentsType: {
        type: Sequelize.STRING,
        defaultValue : INFO
      },
      PetType: {
        type: Sequelize.STRING
      },
      Priority: {
        type: Sequelize.INTEGER,
        defaultValue : 0
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
    await queryInterface.dropTable('Advice');
  }
};