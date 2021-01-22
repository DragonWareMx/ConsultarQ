'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Transaction.belongsTo(models.Pa_Type);
      Transaction.belongsTo(models.Concept);
      Transaction.belongsTo(models.User);
      Transaction.belongsTo(models.Project);
    }
  };
  Transaction.init({
    T_type: DataTypes.ENUM('ingreso', 'egreso'),
    date: DataTypes.DATEONLY,
    amount: DataTypes.DECIMAL,
    description: DataTypes.STRING,
    invoice: DataTypes.BOOLEAN,
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};