'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Intakes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      BowlDeviceID: {
        type: Sequelize.INTEGER,
        references: {
          model : 'BowlDevices',
          key : 'id',
        },
      },
      BowlWeight: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      Amount: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      Wobble: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
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
    await queryInterface.dropTable('Intakes');
  }
};