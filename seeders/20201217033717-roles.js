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
        name: 'DragonWare',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Administrador',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'Arquitecto',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      }
    ], {});

    await queryInterface.bulkInsert('permission_role', [
      {
        Roleid: 1,
        PermissionId: 1,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 3,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 4,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 5,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 6,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 7,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 8,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 9,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 10,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 11,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 12,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 13,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 14,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 15,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 16,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 17,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 18,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 19,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 20,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 21,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 22,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 23,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        Roleid: 1,
        PermissionId: 24,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        PermissionId: 1,
        Roleid: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        PermissionId: 2,
        Roleid: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        PermissionId: 3,
        Roleid: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        PermissionId: 4,
        Roleid: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
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
