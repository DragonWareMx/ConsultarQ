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
      await queryInterface.bulkInsert('Providers', [
        {
          name: 'Adolfo Lemus',
          dro: "12345678",
          email: "adolfo@ejemplo.com",
          phone_number: "4455667788",
          status: 'active'
        },
        {
          name: 'Oscar Huerta',
          dro: "23456789",
          email: "oscar@ejemplo.com",
          phone_number: "5566778899",
          status: 'active'
        },
        {
          name: 'Leonardo Lopez',
          dro: "34567890",
          email: "leo@ejemplo.com",
          phone_number: "9955667788",
          status: 'inactive'
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
