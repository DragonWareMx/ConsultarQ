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
    await queryInterface.bulkInsert('Client_Areas', [
      {
        id: 1,
        name: 'Salud pública',
        description: "Descripcion del area de salud pública",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 2,
        name: 'Constructora industrial',
        description: "Descripcion del area constructora industrial",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 3,
        name: 'Textiles',
        description: "Descripcion del area de textiles",
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
    await queryInterface.bulkDelete('Client_Areas', null, {});
  }
};
