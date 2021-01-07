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
   await queryInterface.bulkInsert('Concepts', [
      {
        id: 1,
        name: 'Pago de servicios',
        description: "Descripcion del concepto"
      },
      {
        id: 2,
        name: 'Viaticos',
        description: "Descripcion del concepto"
      },
      {
        id: 3,
        name: 'Pago de salarios',
        description: "Descripcion del concepto"
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
    await queryInterface.bulkDelete('Concepts', null, {});
  }
};
