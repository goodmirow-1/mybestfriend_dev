'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      UserID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Email: {
        type: Sequelize.STRING(40)
      },
      Password: {
        type: Sequelize.STRING
      },
      LoginType: {
        type: Sequelize.INTEGER(1),
        defaultValue: "0"
      },
      NickName: {
        type: Sequelize.STRING(40)
      },
      Location: {
        type: Sequelize.STRING(40)
      },
      Information: {
        type: Sequelize.STRING
      },
      RealName: {
        type: Sequelize.STRING
      },
      PhoneNumber: {
        type: Sequelize.STRING
      },
      ProfileURL: {
        type: Sequelize.STRING
      },
      Sex: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0
      },
      MarketingAgree: {
        type: Sequelize.BOOLEAN
      },
      MarketingAgreeTime: {
        type: Sequelize.STRING
      },
      LoginState: {
        type: Sequelize.INTEGER(1),
        defaultValue: 0
      },
      RefreshToken: {
        type: Sequelize.STRING(400),
        allowNull: true,
        defaultValue: "0"
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
    await queryInterface.dropTable('Users');
  }
};