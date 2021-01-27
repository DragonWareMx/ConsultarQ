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
    await queryInterface.bulkInsert('pa_types', [
      {
        id: 1,
        name: 'Efectivo',
        description: "Descripcion del tipo de pago",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 2,
        name: 'Tarjeta de credito',
        description: "Descripcion del tipo de pago",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 3,
        name: 'Paypal',
        description: "Descripcion del tipo de pago",
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
    await queryInterface.bulkDelete('Pa_Types', null, {});
  }
};
