'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Task.belongsTo(models.Project)
    }
  };
  Task.init({
    unit: DataTypes.STRING(10),
    units: DataTypes.DECIMAL(10,2),
    concept: {
      allowNull:false,
      type: DataTypes.TEXT(255)
    },
    price: DataTypes.DECIMAL(10,2),
    description: DataTypes.TEXT(500),
    check: {
      allowNull: false,
      defaultValue: false,
      type: DataTypes.BOOLEAN
    }
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};