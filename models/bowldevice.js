'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BowlDevice extends Model {
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
  BowlDevice.init({
    UserID: DataTypes.INTEGER,
    UUID: DataTypes.STRING,
    PetID: DataTypes.INTEGER,
    Weight: DataTypes.DOUBLE,
    Type: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'BowlDevice',
  });
  return BowlDevice;
};