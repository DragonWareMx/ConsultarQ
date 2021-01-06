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
   await queryInterface.bulkInsert('Pa_Types', [
      {
        id: 1,
        name: 'Efectivo',
        description: "Descripcion del tipo de pago"
      },
      {
        id: 2,
        name: 'Tarjeta de credito',
        description: "Descripcion del tipo de pago"
      },
      {
        id: 3,
        name: 'Paypal',
        description: "Descripcion del tipo de pago"
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
