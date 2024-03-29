'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Client.belongsTo(models.Client_Area);
      Client.hasMany(models.Project)
    }
  };
  Client.init({
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    phone_number: DataTypes.STRING,
    rfc: DataTypes.STRING,
    picture: DataTypes.STRING,
    status: DataTypes.ENUM('active', 'inactive')
  }, {
    sequelize,
    modelName: 'Client',
  });
  return Client;
};