'use strict';

//encriptacion
const helpers = require('../lib/helpers');

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
    
    //encriptacion de la password
    const userPassword = await helpers.encryptPassword("viledruid9000");

   await queryInterface.bulkInsert('Users', [{
      email: 'DragonwareOficial@hotmail.com',
      password: userPassword,
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', null, {});
  }
};
