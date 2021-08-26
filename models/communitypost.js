'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommunityPost extends Model {
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
      this.hasMany(models.CommunityPostLike, {
        foreignKey: 'PostID',
      });
      this.hasMany(models.CommunityPostReply, {
        foreignKey: 'PostID',
      });
      this.hasMany(models.CommunityPostDeclare, {
        foreignKey: 'TargetID',
      });
      this.hasMany(models.CommunityPostSubscriber, {
        foreignKey: 'PostID',
      });
    }
  };
  CommunityPost.init({
    UserID: DataTypes.INTEGER,
    Category: DataTypes.STRING,
    Kind: DataTypes.STRING,
    Location: DataTypes.STRING,
    Title: DataTypes.STRING,
    Contents: DataTypes.STRING,
    ImageURL1: DataTypes.STRING,
    ImageURL2: DataTypes.STRING,
    ImageURL3: DataTypes.STRING,
    IsShow: DataTypes.BOOLEAN,
    Type: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'CommunityPost',
  });
  return CommunityPost;
};