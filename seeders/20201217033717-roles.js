'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Roles', [
      {
        name: 'Administrador'
      },
      {
        name: 'Arquitecto'
      }
    ], {});

    await queryInterface.bulkInsert('permission_role', [
      {
        PermissionId: 1,
        Roleid: 1
      },
      {
        PermissionId: 2,
        Roleid: 1
      },
      {
        PermissionId: 3,
        Roleid: 1
      },
      {
        PermissionId: 4,
        Roleid: 1
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
