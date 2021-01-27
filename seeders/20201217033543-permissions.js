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
        name: 'uc',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'ur',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'uu',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'ud',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'cc',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'cr',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'cu',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'cd',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'sc',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'sr',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'su',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'sd',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'pc',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'pr',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'pu',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'pd',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'dc',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'dr',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'du',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'dd',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'ec',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'er',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'eu',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
      },
      {
        name: 'ed',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31'
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
