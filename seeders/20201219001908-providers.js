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
    await queryInterface.bulkInsert('providers', [
      {
        name: 'Adolfo Lemus',
        dro: "12345678",
        email: "adolfo@ejemplo.com",
        phone_number: "4455667788",
        ProviderAreaId: 1,
        status: 'inactive',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Oscar Huerta',
        dro: "23456789",
        email: "oscar@ejemplo.com",
        phone_number: "5566778899",
        ProviderAreaId: 2,
        status: 'active',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        name: 'Leonardo Lopez',
        dro: "34567890",
        email: "leo@ejemplo.com",
        phone_number: "9955667788",
        ProviderAreaId: 4,
        status: 'inactive',
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
    await queryInterface.bulkDelete('Providers', null, {});
  }
};
