'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Intake extends Model {
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
  Intake.init({
    PetID: DataTypes.INTEGER,
    FoodID : DataTypes.INTEGER,
    BowlWeight: DataTypes.DOUBLE,
    Amount: DataTypes.DOUBLE,
    BowlType: DataTypes.INTEGER,
    State: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Intake',
  });
  return Intake;
};