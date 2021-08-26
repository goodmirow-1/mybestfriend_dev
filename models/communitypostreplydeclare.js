'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommunityPostReplyDeclare extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.CommunityPostReply,{
        foreignKey : { name : 'TargetID'},
        onDelete : 'CASCADE'
      });
    }
  };
  CommunityPostReplyDeclare.init({
    UserID: DataTypes.INTEGER,
    TargetID: DataTypes.INTEGER,
    Contents: DataTypes.STRING,
    Type: DataTypes.INTEGER,
    IsProcessing: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'CommunityPostReplyDeclare',
  });
  return CommunityPostReplyDeclare;
};