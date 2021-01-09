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
      Task.belongsTo(models.Project_Requirement)
    }
  };
  Task.init({
    unit: DataTypes.STRING(10),
    units: DataTypes.STRING(16),
    concept: {
      allowNull:false,
      type: DataTypes.TEXT
    },
    price: DataTypes.DECIMAL,
    description: DataTypes.TEXT,
    amount: DataTypes.DECIMAL,
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