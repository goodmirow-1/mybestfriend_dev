'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PetPhoto extends Model {
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
  PetPhoto.init({
    PetID: DataTypes.INTEGER,
    Index: DataTypes.INTEGER,
    ProfileURL: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PetPhoto',
  });
  return PetPhoto;
};