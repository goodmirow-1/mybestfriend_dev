'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FcmTokenLists', {
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
      Token: {
        type: Sequelize.STRING
      },
      Eating: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
      },
      Analysis: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
      },
      Advice: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
      },
      Community: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
      },
      Marketing: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
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
    await queryInterface.dropTable('FcmTokenLists');
  }
};