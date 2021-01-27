'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ProTypeId: {
        type: Sequelize.INTEGER,
        onDelete: 'SET NULL',
        references: {
          model: 'pro_types',
          key: 'id',
        },
      },
      ClientId: {
        type: Sequelize.INTEGER,
        onDelete: 'SET NULL',
        references: {
          model: 'clients',
          key: 'id',
        },
      },
      contract: {
        type: Sequelize.STRING
      },
      color: {
        allowNull: false,
        type: Sequelize.STRING(7)
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      observations: {
        type: Sequelize.STRING
      },
      start_date: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      deadline: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      end_date: {
        type: Sequelize.DATEONLY
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('activo', 'cancelado', 'terminado'),
        defaultValue: 'activo',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Projects');
  }
};