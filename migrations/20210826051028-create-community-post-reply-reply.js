'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPostReplyReplies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER
      },
      ReplyID: {
        type: Sequelize.INTEGER,
        onDelete : 'CASCADE',
        references: {
          model : 'CommunityPostReplies',
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
    await queryInterface.dropTable('CommunityPostReplyReplies');
  }
};