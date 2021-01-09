'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project.belongsToMany(models.User, { through: 'project_employees', uniqueKey: 'ProjectId' });
      Project.hasOne(models.Project_Requirement)
      Project.belongsTo(models.Pro_Type)
    }
  };
  Project.init({
    contract: DataTypes.STRING,
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    observations: DataTypes.STRING,
    start_date: {
      allowNull: false,
      type: DataTypes.DATEONLY
    },
    end_date: {
      allowNull: false,
      type: DataTypes.DATEONLY
    }
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};