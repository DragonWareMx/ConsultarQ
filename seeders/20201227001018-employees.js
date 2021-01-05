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

    await queryInterface.bulkInsert('Employees', [{
      name: 'DragonWare',
      phone_number: "4435555555",
      city: "Morelia",
      state: "Michoacán",
      suburb: "Lomas del tecnológico",
      street: "Sierra nevada",
      int_number: "301",
      ext_number: "55",
      hiring_date: "12-12-2020",
      UserId: 1
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Employees', null, {});
  }
};
