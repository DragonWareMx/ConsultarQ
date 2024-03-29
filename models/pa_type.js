'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pa_Type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pa_Type.hasMany(models.Transaction)
    }
  };
  Pa_Type.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Pa_Type',
  });
  return Pa_Type;
};