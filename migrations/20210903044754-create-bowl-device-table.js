'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BowlDeviceTables', {
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
      UUID: {
        type: Sequelize.STRING
      },
      BowlWeight: {
        type: Sequelize.DOUBLE,
        defaultValue : 0.0
      },
      Type: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      Baterry: {
        type: Sequelize.INTEGER,
        defaultValue : 5    //배터리 5단계
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
    await queryInterface.dropTable('BowlDeviceTables');
  }
};