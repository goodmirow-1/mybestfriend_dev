'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommunityPostReplyReply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.CommunityPostReply,{
        foreignKey : { name : 'ReplyID'},
        onDelete : 'CASCADE'
      });
      this.hasMany(models.CommunityPostReplyReplyDeclare, {
        foreignKey: 'TargetID',
      });
    }
  };
  CommunityPostReplyReply.init({
    UserID: DataTypes.INTEGER,
    ReplyID: DataTypes.INTEGER,
    Contents: DataTypes.STRING,
    IsShow: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'CommunityPostReplyReply',
  });
  return CommunityPostReplyReply;
};