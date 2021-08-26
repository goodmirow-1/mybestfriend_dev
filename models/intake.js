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
      this.belongsTo( models.BowlDevice, {
        foreignKey : "BowlDeviceID",
        onDelete : "cascade",
      });
    }
  };
  Intake.init({
    BowlDeviceID: DataTypes.INTEGER,
    BowlWeight: DataTypes.DOUBLE,
    Amount: DataTypes.DOUBLE,
    Wobble: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'Intake',
  });
  return Intake;
};