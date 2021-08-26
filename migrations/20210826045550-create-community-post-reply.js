'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPostReplies', {
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
      Contents: {
        type: Sequelize.STRING
      },
      IsShow: {
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
    await queryInterface.dropTable('CommunityPostReplies');
  }
};