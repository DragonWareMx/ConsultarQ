'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project_Requirement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Project_Requirement.belongsTo(models.Project)
      Project_Requirement.hasMany(models.Task)
    }
  };
  Project_Requirement.init({
    //
  }, {
    sequelize,
    modelName: 'Project_Requirement',
  });
  return Project_Requirement;
};