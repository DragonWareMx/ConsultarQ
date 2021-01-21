'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client_Area extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Client_Area.hasMany(models.Client)
    }
  };
  Client_Area.init({
    name: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Client_Area',
  });
  return Client_Area;
};