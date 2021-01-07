'use strict';
const { encrypt } = require('../lib/crypto');

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
      name: encrypt('DragonWare'),
      phone_number: encrypt("4435555555"),
      city: encrypt("Morelia"),
      state: encrypt("Michoacán"),
      suburb: encrypt("Lomas del tecnológico"),
      street: encrypt("Sierra nevada"),
      int_number: encrypt("301"),
      ext_number: encrypt("55"),
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
