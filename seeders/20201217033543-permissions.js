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
    await queryInterface.bulkInsert('Permissions', [
      {
        name: 'uc'
      },
      {
        name: 'ur'
      },
      {
        name: 'uu'
      },
      {
        name: 'ud'
      },
      {
        name: 'cc'
      },
      {
        name: 'cr'
      },
      {
        name: 'cu'
      },
      {
        name: 'cd'
      },
      {
        name: 'sc'
      },
      {
        name: 'sr'
      },
      {
        name: 'su'
      },
      {
        name: 'sd'
      },
      {
        name: 'pc'
      },
      {
        name: 'pr'
      },
      {
        name: 'pu'
      },
      {
        name: 'pd'
      },
      {
        name: 'dc'
      },
      {
        name: 'dr'
      },
      {
        name: 'du'
      },
      {
        name: 'dd'
      },
      {
        name: 'ec'
      },
      {
        name: 'er'
      },
      {
        name: 'eu'
      },
      {
        name: 'ed'
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
