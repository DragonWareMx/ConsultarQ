'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      phone_number: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      city: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      state: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      suburb: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      street: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      int_number: {
        type: Sequelize.TEXT
      },
      ext_number: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      hiring_date: {
        type: Sequelize.DATEONLY
      },
      UserId: {
        type: Sequelize.INTEGER,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false
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
    await queryInterface.dropTable('Employees');
  }
};