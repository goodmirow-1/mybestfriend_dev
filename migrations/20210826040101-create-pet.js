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
        type: Sequelize.INTEGER
      },
      Type: {
        type: Sequelize.INTEGER
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
      Disease: {
        type: Sequelize.STRING
      },
      Allergy: {
        type: Sequelize.STRING
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