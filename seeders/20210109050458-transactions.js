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
    await queryInterface.bulkInsert('transactions', [
      {
        T_type: 'ingreso',
        date: "2018-2-25",
        amount: "600.00",
        description: "Descripcion de la transaccion",
        invoice: 0,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 1,
        ConceptId: 1,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'egreso',
        date: "2018-11-20",
        amount: "800.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 1,
        ProjectId: 1,
        PaTypeId: 2,
        ConceptId: 1,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'egreso',
        date: "2019-1-15",
        amount: "150.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 3,
        ConceptId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'egreso',
        date: "2019-1-10",
        amount: "1000.00",
        description: "Descripcion de la transaccion",
        invoice: 0,
        UserId: 1,
        ProjectId: 1,
        PaTypeId: 1,
        ConceptId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'ingreso',
        date: "2018-8-6",
        amount: "750.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 1,
        ProjectId: 1,
        PaTypeId: 2,
        ConceptId: 3,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'ingreso',
        date: "2018-10-9",
        amount: "1200.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 3,
        ConceptId: 3,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'egreso',
        date: "2019-10-19",
        amount: "700.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 1,
        ConceptId: 1,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'ingreso',
        date: "2019-2-14",
        amount: "500.00",
        description: "Descripcion de la transaccion",
        invoice: 0,
        UserId: 1,
        ProjectId: 1,
        PaTypeId: 2,
        ConceptId: 2,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'ingreso',
        date: "2019-3-26",
        amount: "2000.00",
        description: "Descripcion de la transaccion",
        invoice: 0,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 3,
        ConceptId: 3,
        createdAt: '2020-12-31',
        updatedAt: '2020-12-31',
      },
      {
        T_type: 'egreso',
        date: "2019-7-12",
        amount: "900.00",
        description: "Descripcion de la transaccion",
        invoice: 1,
        UserId: 2,
        ProjectId: 1,
        PaTypeId: 3,
        ConceptId: 2,
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
    await queryInterface.bulkDelete('Transactions', null, {});
  }
};
