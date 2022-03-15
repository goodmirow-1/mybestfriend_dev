'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IntakeSnack extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo( models.Pet, {
        foreignKey : "PetID",
        onDelete : "cascade",
      });
    }
  };
  IntakeSnack.init({
    PetID: DataTypes.INTEGER,
    SnackID: DataTypes.INTEGER,
    Amount: DataTypes.DOUBLE,
    Water: DataTypes.DOUBLE,
    Calorie: DataTypes.INTEGER,
    Time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'IntakeSnack',
  });
  return IntakeSnack;
};