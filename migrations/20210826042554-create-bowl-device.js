'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BowlDevices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER
      },
      UUID: {
        type: Sequelize.STRING
      },
      PetID: {
        type: Sequelize.INTEGER,
        references: {
          model : 'Pets',
          key : 'id',
        },
      },
      Weight: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      Type: {
        type: Sequelize.INTEGER(1),
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
    await queryInterface.dropTable('BowlDevices');
  }
};