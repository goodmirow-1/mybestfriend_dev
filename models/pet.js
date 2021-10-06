'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey : "UserID",
        onDelete : "cascade",
      });
      this.hasMany(models.PetPhoto, {
        foreignKey: 'PetID'
      });
      this.hasMany(models.BowlDeviceTable, {
        foreignKey: 'PetID'
      })
      this.hasMany(models.Intake, {
        foreignKey: 'PetID'
      })
    }
  };
  Pet.init({
    UserID: DataTypes.INTEGER,
    Index: DataTypes.INTEGER,
    Type: DataTypes.INTEGER,
    Name: DataTypes.STRING,
    Birthday: DataTypes.STRING,
    Kind: DataTypes.STRING,
    Weight: DataTypes.DOUBLE,
    Sex: DataTypes.INTEGER,
    Disease: DataTypes.STRING,
    Allergy: DataTypes.STRING,
    FoodID: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Pet',
  });
  return Pet;
};