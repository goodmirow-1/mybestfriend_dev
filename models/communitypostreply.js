'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommunityPostReply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.CommunityPost,{
        foreignKey : { name : 'PostID'},
        onDelete : 'CASCADE',
      });
      this.hasMany(models.CommunityPostReplyDeclare, {
        foreignKey: 'TargetID',
      });
      this.hasMany(models.CommunityPostReplyReply, {
        foreignKey: 'ReplyID',
      });
    }
  };
  CommunityPostReply.init({
    UserID: DataTypes.INTEGER,
    PostID: DataTypes.INTEGER,
    Contents: DataTypes.STRING,
    IsShow: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'CommunityPostReply',
  });
  return CommunityPostReply;
};