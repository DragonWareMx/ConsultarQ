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
        name: 'DragonWare'
      },
      {
        name: 'Administrador'
      },
      {
        name: 'Arquitecto'
      }
    ], {});

    await queryInterface.bulkInsert('permission_role', [
      {
        Roleid: 1,
        PermissionId: 1
      },
      {
        Roleid: 1,
        PermissionId: 2
      },
      {
        Roleid: 1,
        PermissionId: 3
      },
      {
        Roleid: 1,
        PermissionId: 4
      },
      {
        Roleid: 1,
        PermissionId: 5
      },
      {
        Roleid: 1,
        PermissionId: 6
      },
      {
        Roleid: 1,
        PermissionId: 7
      },
      {
        Roleid: 1,
        PermissionId: 8
      },
      {
        Roleid: 1,
        PermissionId: 9
      },
      {
        Roleid: 1,
        PermissionId: 10
      },
      {
        Roleid: 1,
        PermissionId: 11
      },
      {
        Roleid: 1,
        PermissionId: 12
      },
      {
        Roleid: 1,
        PermissionId: 13
      },
      {
        Roleid: 1,
        PermissionId: 14
      },
      {
        Roleid: 1,
        PermissionId: 15
      },
      {
        Roleid: 1,
        PermissionId: 16
      },
      {
        Roleid: 1,
        PermissionId: 17
      },
      {
        Roleid: 1,
        PermissionId: 18
      },
      {
        Roleid: 1,
        PermissionId: 19
      },
      {
        Roleid: 1,
        PermissionId: 20
      },
      {
        Roleid: 1,
        PermissionId: 21
      },
      {
        Roleid: 1,
        PermissionId: 22
      },
      {
        Roleid: 1,
        PermissionId: 23
      },
      {
        Roleid: 1,
        PermissionId: 24
      },
      {
        PermissionId: 1,
        Roleid: 2
      },
      {
        PermissionId: 2,
        Roleid: 2
      },
      {
        PermissionId: 3,
        Roleid: 2
      },
      {
        PermissionId: 4,
        Roleid: 2
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
