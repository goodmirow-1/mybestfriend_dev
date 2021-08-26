'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPostLikes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER
      },
      PostID: {
        type: Sequelize.INTEGER,
        onDelete : 'CASCADE',
        references: {
          model : 'CommunityPosts',
          key : 'id',
        },
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
    await queryInterface.dropTable('CommunityPostLikes');
  }
};