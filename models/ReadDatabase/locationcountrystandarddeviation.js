'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LocationCountryStandardDeviation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  LocationCountryStandardDeviation.init({
    Location: DataTypes.STRING,
    FoodStandardDeviation: DataTypes.DOUBLE,
    FoodAverage: DataTypes.DOUBLE,
    WaterStandardDeviation: DataTypes.DOUBLE,
    WaterAverage: DataTypes.DOUBLE,
    DogWeightStandardDeviation: DataTypes.DOUBLE,
    DogWeightAverage: DataTypes.DOUBLE,
    CatWeightStandardDeviation: DataTypes.DOUBLE,
    CatWeightAverage: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'LocationCountryStandardDeviation',
  });
  return LocationCountryStandardDeviation;
};