'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FcmTokenList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.FcmTokenList, {
        foreignKey: 'UserID',
      });
    }
  };
  FcmTokenList.init({
    UserID: DataTypes.INTEGER,
    Token: DataTypes.STRING,
    Eating: DataTypes.BOOLEAN,
    Analysis: DataTypes.BOOLEAN,
    Advice: DataTypes.BOOLEAN,
    Community: DataTypes.BOOLEAN,
    Marketing: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'FcmTokenList',
  });
  return FcmTokenList;
};