'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Employee.init({
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    phone_number: {
      allowNull: false,
      type: DataTypes.STRING(50)
    },
    city: {
      allowNull: false,
      type: DataTypes.STRING
    },
    state: {
      allowNull: false,
      type: DataTypes.STRING
    },
    suburb: {
      allowNull: false,
      type: DataTypes.STRING
    },
    street: {
      allowNull: false,
      type: DataTypes.STRING
    },
    int_number: {
      allowNull: false,
      type: DataTypes.STRING(10)
    },
    ext_number: DataTypes.STRING(10),
    hiring_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Employee',
  });
  return Employee;
};