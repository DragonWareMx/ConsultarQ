'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service_Portfolio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Service_Portfolio.init({
    pdf: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Service_Portfolio',
  });
  return Service_Portfolio;
};