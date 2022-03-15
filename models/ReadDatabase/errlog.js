'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Errlog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Errlog.init({
    PetID: DataTypes.INTEGER,
    Message: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Errlog',
  });
  return Errlog;
};