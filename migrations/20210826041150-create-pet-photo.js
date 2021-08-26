'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PetPhotos', {
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
      Index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ProfileURL: {
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
    await queryInterface.dropTable('PetPhotos');
  }
};