'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPostDeclares', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER
      },
      TargetID: {
        type: Sequelize.INTEGER,
        references: {
          model : 'CommunityPosts',
          key : 'id',
        },
      },
      Contents: {
        type: Sequelize.STRING
      },
      Type: {
        type: Sequelize.INTEGER
      },
      IsProcessing: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('CommunityPostDeclares');
  }
};