'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project_Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project_Employee.belongsTo(models.User)
      Project_Employee.belongsTo(models.Project)
      Project_Employee.hasMany(models.Transaction)
    }
  };
  Project_Employee.init({
    profit: DataTypes.STRING(3),
    role: {
      type: DataTypes.STRING(100)
    },
  }, {
    sequelize,
    modelName: 'Project_Employee',
  });
  return Project_Employee;
};