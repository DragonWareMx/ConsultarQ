'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tasks_Layout extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Tasks_Layout.belongsTo(models.Pro_Type)
    }
  };
  Tasks_Layout.init({
    unit: DataTypes.STRING,
    concept: {
      allowNull:false,
      type: DataTypes.TEXT
    },
    price: DataTypes.DECIMAL,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Tasks_Layout',
  });
  return Tasks_Layout;
};