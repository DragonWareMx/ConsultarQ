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
    await queryInterface.bulkInsert('clients', [
      {
        name: 'Adolfo Leonardo Huerta Garcia',
        email: 'adoleo@gmail.com',
        phone_number: '1122334455',
        rfc: 'VECJ880326',
        status: 'active',
        ClientAreaId: 1,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Dulce Lopez Lemus',
        email: 'candy@gmail.com',
        phone_number: '9988774455',
        rfc: 'VECJ880326',
        status: 'active',
        ClientAreaId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Fernando Andre Aguilar Rendon',
        email: 'fernadre@gmail.com',
        phone_number: '8877334455',
        rfc: 'VECJ880326',
        status: 'inactive',
        ClientAreaId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Agustin Adrian Marin',
        email: 'agusAA@gmail.com',
        phone_number: '1122339966',
        rfc: 'VECJ880326',
        status: 'active',
        ClientAreaId: 3,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Clients', null, {});
  }
};
