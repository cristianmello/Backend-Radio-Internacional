'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * La función 'up' se ejecuta cuando corres 'db:migrate'.
     * Aplica el cambio a la base de datos.
     */
    await queryInterface.changeColumn('users', 'user_image', {
      type: Sequelize.STRING(255),
      allowNull: false,
      // El NUEVO valor por defecto
      defaultValue: 'https://realidadnacional.b-cdn.net/profile-images/default.webp'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * La función 'down' se ejecuta cuando corres 'db:migrate:undo'.
     * Sirve para revertir el cambio, volviendo al estado anterior.
     */
    await queryInterface.changeColumn('users', 'user_image', {
      type: Sequelize.STRING(255),
      allowNull: false,
      // El ANTIGUO valor por defecto para poder revertir
      defaultValue: 'https://storage.bunnycdn.com/radiointernacional/profile-images/default.webp'
    });
  }
};