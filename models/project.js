'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project.belongsToMany(models.User, { through: 'project_employees', uniqueKey: 'ProjectId' });
      Project.hasOne(models.Project_Requirement)
      Project.belongsTo(models.Pro_Type)
    }
  };
  Project.init({
    contract: DataTypes.STRING,
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    observations: DataTypes.STRING,
    start_date: {
      allowNull: false,
      type: DataTypes.DATEONLY
    },
    deadline: {
      allowNull: false,
      type: DataTypes.DATEONLY
    },
    end_date: {
      type: DataTypes.DATEONLY
    },
    status:{
      allowNull: false,
      type: DataTypes.ENUM('activo', 'cancelado','terminado'),
      defaultValue: 'activo',
      get(){
        if(this.getDataValue('status') == 'activo'){
          if(!this.getDataValue('end_date')){
            //obtenemos la fecha actual y el deadline
            var endDate = new Date()
            endDate.setHours(5,22,33,0)
            var deadline = new Date(this.getDataValue('deadline')+"T11:22:33+0000")

            //se comparan
            if(endDate.getTime() <= deadline.getTime()){
              return 'ACTIVO'
            }
            else{
              return 'ATRASADO'
            }
          }
          else{
            var endDate = new Date(this.getDataValue('end_date')+"T11:22:33+0000")
            var deadline = new Date(this.getDataValue('deadline')+"T11:22:33+0000")
            if(endDate.getTime() <= deadline.getTime()){
              return 'EN TIEMPO'
            }
            else{
              return 'ATRASADO'
            }
          }
        }
        else if(this.getDataValue('status') == 'terminado'){
          var endDate = new Date(this.getDataValue('end_date')+"T11:22:33+0000")
          var deadline = new Date(this.getDataValue('deadline')+"T11:22:33+0000")
          if(endDate.getTime() <= deadline.getTime()){
            return 'EN TIEMPO'
          }
          else{
            return 'ATRASADO'
          }
        }
        else {
          return 'CANCELADO'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};