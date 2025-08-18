'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * La función 'up' se ejecuta cuando aplicas la migración.
     * Aquí añadimos la nueva columna 'background_color' a la tabla 'sectionarticles'.
     */
    await queryInterface.addColumn('sectionarticles', 'background_color', {
      type: Sequelize.STRING(7),
      allowNull: true,
      defaultValue: '#f8f9fa', // Color blanco por defecto
      after: 'section_title' // Opcional: Coloca la columna después de 'section_title'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * La función 'down' se ejecuta cuando reviertes la migración.
     * Aquí eliminamos la columna 'background_color', dejando la tabla como estaba antes.
     */
    await queryInterface.removeColumn('sectionarticles', 'background_color');
  }
};