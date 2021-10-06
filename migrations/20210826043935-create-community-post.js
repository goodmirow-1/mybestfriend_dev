'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityPosts', {
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
      Category: {
        type: Sequelize.STRING
      },
      Kind: {
        type: Sequelize.STRING
      },
      Location: {
        type: Sequelize.STRING
      },
      Title: {
        type: Sequelize.STRING
      },
      Contents: {
        type: Sequelize.STRING
      },
      ImageURL1: {
        type: Sequelize.STRING
      },
      ImageURL2: {
        type: Sequelize.STRING
      },
      ImageURL3: {
        type: Sequelize.STRING
      },
      PetType: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Type: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Point: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      RegisterTime : {
        type: Sequelize.DATE,
      },
      IsShow: {
        type: Sequelize.BOOLEAN,
        defaultValue : true,
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
    await queryInterface.dropTable('CommunityPosts');
  }
};