'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LocationStandardDeviation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  LocationStandardDeviation.init({
    Location: DataTypes.STRING,
    FoodStandardDeviation: DataTypes.DOUBLE,
    FoodAverage: DataTypes.DOUBLE,
    WaterStandardDeviation: DataTypes.DOUBLE,
    WaterAverage: DataTypes.DOUBLE,
    WeightStandardDeviation: DataTypes.DOUBLE,
    WeightAverage: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'LocationStandardDeviation',
  });
  return LocationStandardDeviation;
};