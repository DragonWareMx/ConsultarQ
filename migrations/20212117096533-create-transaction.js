'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      T_type: {
        type: Sequelize.ENUM('ingreso', 'egreso')
      },
      date: {
        type: Sequelize.DATEONLY
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      description: {
        type: Sequelize.STRING
      },
      invoice: {
        type: Sequelize.BOOLEAN
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      ProjectEmployeeId: {
        type: Sequelize.INTEGER,
        onDelete: 'SET NULL',
        references: {
          model: 'Project_Employees',
          key: 'id',
        },
      },
      PaTypeId: {
        type: Sequelize.INTEGER,
        onDelete: 'SET NULL',
        references: {
          model: 'Pa_Types',
          key: 'id',
        },
      },
      ConceptId: {
        type: Sequelize.INTEGER,
        onDelete: 'SET NULL',
        references: {
          model: 'Concepts',
          key: 'id',
        },
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Transactions');
  }
};