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
      color: "#3B86D9"
    }], {});
    await queryInterface.bulkInsert('Project_Employees', [{
      UserId: 2,
      ProjectId: 1,
      profit: "100"
    }], {});
    await queryInterface.bulkInsert('Comments', [{
      ProjectEmployeeId: 1,
      comment: 'Este proyecto ya está muy atrasado.',
      createdAt: Date.now(), updatedAt: Date.now()
    }], {});

    await queryInterface.bulkInsert('Tasks', [
      {
        ProjectId: 1,
        concept: 'Elaborar planos.',
        check: false
      },
      {
        ProjectId: 1,
        concept: 'Otro requisito de prueba.',
        check: true
      }
    ], {});
    await queryInterface.bulkInsert('Pro_Types', [{
      name: "Layout de proyecto número 1",
    }], {});
    await queryInterface.bulkInsert('Tasks_Layouts', [
      {
        ProTypeId: 1,
        unit: 'Kg.',
        concept: 'Cemento',
        price:'100',
        description:'Cemento para ladrillos industrial.'
      },
      {
        ProTypeId: 1,
        unit: 'lt.',
        concept: 'Arcilla',
        price:'500',
        description:'Arcilla líquida para hacer manualidades.'
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
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('Project_Employees', null, {});
  }
};
