'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable('permission_role', 
    { 
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true
        },
        PermissionId: {
          primaryKey: true,
          type: Sequelize.INTEGER,
          onDelete: 'CASCADE',
          references: {
            model: 'Permissions',
            key: 'id',
          },
        },
        RoleId: {
          primaryKey: true,
          type: Sequelize.INTEGER,
          onDelete: 'CASCADE',
          references: {
            model: 'Roles',
            key: 'id',
          },
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
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropTable('permission_role');
  }
};
