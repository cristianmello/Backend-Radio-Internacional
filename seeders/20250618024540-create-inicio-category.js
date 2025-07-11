'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('articlecategories', [
      {
        category_name: 'Inicio',
        category_slug: 'inicio',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('articlecategories', {
      category_slug: 'inicio'
    }, {});
  }
};
