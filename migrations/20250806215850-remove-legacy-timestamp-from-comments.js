'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // La función 'up' elimina la columna obsoleta.
    await queryInterface.removeColumn('commentarticles', 'comment_created_at');
  },

  async down(queryInterface, Sequelize) {
    // La función 'down' revierte el cambio, volviendo a añadir la columna
    // por si alguna vez necesitas deshacer esta migración.
    await queryInterface.addColumn('commentarticles', 'comment_created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  }
};