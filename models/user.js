'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Pet, {
        foreignKey: 'UserID'
      });
    }
  };
  User.init({
    Email: DataTypes.STRING,
    Password: DataTypes.STRING,
    LoginType: DataTypes.INTEGER,
    NickName: DataTypes.STRING,
    Location: DataTypes.STRING,
    Information: DataTypes.STRING,
    RealName: DataTypes.STRING,
    PhoneNumber: DataTypes.STRING,
    ProfileURL: DataTypes.STRING,
    Sex: DataTypes.BOOLEAN,
    MarketingAgree: DataTypes.BOOLEAN,
    MarketingAgreeTime: DataTypes.STRING,
    LoginState: DataTypes.INTEGER,
    RefreshToken: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};