'use strict';
//encriptacion
const { encrypt, decrypt } = require('../lib/crypto');

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
      Employee.belongsTo(models.User);
    }
  };
  Employee.init({
    name: {
      allowNull: false,
      type: DataTypes.TEXT,
      get(){
        return decrypt(this.getDataValue('name'))
      },
      set(value){
        this.setDataValue('name',encrypt(value))
      }
    },
    phone_number: {
      allowNull: false,
      type: DataTypes.TEXT,
      get(){
        return decrypt(this.getDataValue('phone_number'))
      },
      set(value){
        this.setDataValue('phone_number',encrypt(value))
      }
    },
    city: {
      allowNull: false,
      type: DataTypes.STRING,
      get(){
        return decrypt(this.getDataValue('city'))
      },
      set(value){
        this.setDataValue('city',encrypt(value))
      }
    },
    state: {
      allowNull: false,
      type: DataTypes.STRING,
      get(){
        return decrypt(this.getDataValue('state'))
      },
      set(value){
        this.setDataValue('state',encrypt(value))
      }
    },
    suburb: {
      allowNull: false,
      type: DataTypes.STRING,
      get(){
        return decrypt(this.getDataValue('suburb'))
      },
      set(value){
        this.setDataValue('suburb',encrypt(value))
      }
    },
    street: {
      allowNull: false,
      type: DataTypes.STRING,
      get(){
        return decrypt(this.getDataValue('street'))
      },
      set(value){
        this.setDataValue('street',encrypt(value))
      }
    },
    int_number: {
      type: DataTypes.STRING(10),
      get(){
        return decrypt(this.getDataValue('int_number'))
      },
      set(value){
        this.setDataValue('int_number',encrypt(value))
      }
    },
    ext_number: {
      allowNull: false,
      type: DataTypes.STRING(10),
      get(){
        return decrypt(this.getDataValue('ext_number'))
      },
      set(value){
        this.setDataValue('ext_number',encrypt(value))
      }
    },
    hiring_date: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Employee',
  });
  return Employee;
};