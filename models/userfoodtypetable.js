'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserFoodTypeTable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserFoodTypeTable.init({
    UserID: DataTypes.INTEGER,
    BrandName: DataTypes.STRING,
    KoreaName: DataTypes.STRING,
    EnglishName: DataTypes.STRING,
    PerProtine: DataTypes.DOUBLE,
    PerFat: DataTypes.DOUBLE,
    Carbohydrate: DataTypes.DOUBLE,
    Calorie: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'FoodTypeTable',
  });
  return UserFoodTypeTable;
};