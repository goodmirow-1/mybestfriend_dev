'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    UserID: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    Email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    LoginType: {
      type : DataTypes.INTEGER,
      allowNull: true,
    },
    Password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    LoginType: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    NickName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    RealName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PhoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ProfileURL:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    Sex: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    Birthday: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    RefreshToken: {
      type: DataTypes.STRING(400),
      allowNull: true,
      defaultValue: "0"
    },
    MarketingAgree: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: "1"
    },
    MarketingAgreeTime: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    LoginState: {
      type : DataTypes.INTEGER,
      allowNull: false,
      defaultValue: "0"
    },
  }, {});
  User.associate = function (models) {
    this.hasMany(models.Pet, {
      foreignKey: 'UserID'
    });
    this.hasMany(models.CommunityPost, {
      foreignKey: 'UserID'
    })
  };
  return User;
};