'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SurveyProfile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  SurveyProfile.init({
    Name: DataTypes.STRING,
    PhoneNumber: DataTypes.STRING,
    Location: DataTypes.STRING,
    PetType: DataTypes.STRING,
    Point: DataTypes.INTEGER,
    Prize: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SurveyProfile',
  });
  return SurveyProfile;
};