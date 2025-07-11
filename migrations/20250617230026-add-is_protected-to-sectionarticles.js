'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sectionarticles', 'is_protected', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Marca secciones que no pueden eliminarse'
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sectionarticles', 'is_protected');

  }
};
