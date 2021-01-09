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
   await queryInterface.bulkInsert('Projects', [{
      name: "Proyecto de John Doe",
      observations: "El proyecto ya inició",
      start_date: "2020-01-01",
      deadline: "2020-12-12",
    }], {});
    await queryInterface.bulkInsert('Project_Employees', [{
      UserId: 2,
      ProjectId: 1,
      profit: "100"
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('Project_Employees', null, {});
  }
};
