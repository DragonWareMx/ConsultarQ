'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
      User.hasOne(models.Employee);
      User.belongsTo(models.Role);
      User.hasMany(models.Log);
      User.belongsToMany(models.Project, { through: models.Project_Employee, uniqueKey: 'UserId' });
      User.hasMany(models.Project_Employee)
      User.hasMany(models.Comment)
      User.hasMany(models.Transaction)
    }
  };
  User.init({
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING(320)
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING
    },
    picture: {
      type: DataTypes.STRING
    },
    resetLink: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};