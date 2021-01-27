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
    await queryInterface.bulkInsert('provider_areas', [
      {
        id: 1,
        name: 'Plomeria',
        description: "Descripcion del area de plomeria",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 3,
        name: 'Materiales',
        description: "Descripcion del area de materiales",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 2,
        name: 'Herreria',
        description: "Descripcion del area de herreria",
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        id: 4,
        name: 'Carpinteria',
        description: "Descripcion del area de carpinteria",
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
    await queryInterface.bulkDelete('Provider_areas', null, {});
  }
};
