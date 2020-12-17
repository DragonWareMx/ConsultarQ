'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pro_Type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Pro_Type.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Pro_Type',
  });
  return Pro_Type;
};