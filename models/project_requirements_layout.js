'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project_Requirements_Layout extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project_Requirements_Layout.belongsTo(models.Pro_Type)
      Project_Requirements_Layout.hasMany(models.Tasks_Layout)
    }
  };
  Project_Requirements_Layout.init({
    ProTypeId: DataTypes.INTEGER,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Project_Requirements_Layout',
  });
  return Project_Requirements_Layout;
};