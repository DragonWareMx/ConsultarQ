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
    await queryInterface.bulkInsert('projects', [{
      name: "Proyecto de John Doe",
      observations: "El proyecto ya inició",
      start_date: "2020-01-01",
      deadline: "2020-12-12",
      color: "#3B86D9",
      createdAt: '2020-12-31',
      updatedAt: '2020-12-31',
    }], {});
    await queryInterface.bulkInsert('project_employees', [{
      UserId: 2,
      ProjectId: 1,
      profit: "100",
      createdAt: '2020-12-31',
      updatedAt: '2020-12-31',
    }], {});
    await queryInterface.bulkInsert('comments', [{
      ProjectId: 1,
      UserId: 2,
      comment: 'Este proyecto ya está muy atrasado.',
      createdAt: '2020-12-31',
      updatedAt: '2020-12-31',
    }], {});

    await queryInterface.bulkInsert('tasks', [
      {
        ProjectId: 1,
        concept: 'Elaborar planos.',
        check: false,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        ProjectId: 1,
        concept: 'Otro requisito de prueba.',
        check: true,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      }
    ], {});
    await queryInterface.bulkInsert('pro_types', [{
      name: "Layout de proyecto número 1",
      createdAt: '2020-12-31',
      updatedAt: '2020-12-31',
    }], {});
    await queryInterface.bulkInsert('tasks_layouts', [
      {
        ProTypeId: 1,
        unit: 'Kg.',
        concept: 'Cemento',
        price: '100',
        description: 'Cemento para ladrillos industrial.',
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        ProTypeId: 1,
        unit: 'lt.',
        concept: 'Arcilla',
        price: '500',
        description: 'Arcilla líquida para hacer manualidades.',
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
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('Project_Employees', null, {});
  }
};
