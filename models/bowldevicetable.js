'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BowlDeviceTable extends Model {
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

      this.hasMany( models.Intake, {
        foreignKey: "id",
        onDelete : "cascade",
      })
    }
  };
  BowlDeviceTable.init({
    PetID: DataTypes.INTEGER,
    UUID: DataTypes.STRING,
    BowlWeight: DataTypes.DOUBLE,
    Type: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'BowlDeviceTable',
  });
  return BowlDeviceTable;
};