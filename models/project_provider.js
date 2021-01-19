'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project_Provider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project_Provider.belongsTo(models.Project)
      Project_Provider.belongsTo(models.Provider)
    }
  };
  Project_Provider.init({
    
  }, {
    sequelize,
    modelName: 'Project_Provider',
  });
  return Project_Provider;
};