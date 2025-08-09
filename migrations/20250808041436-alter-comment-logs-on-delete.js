'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // PASO 1: Modificamos la columna para que permita valores nulos.
      // Esto es necesario para que la regla 'SET NULL' pueda funcionar.
      await queryInterface.changeColumn('comment_logs', 'comment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      // PASO 2: Añadimos la constraint de clave foránea que falta.
      await queryInterface.addConstraint('comment_logs', {
        fields: ['comment_id'],
        type: 'foreign key',
        name: 'comment_logs_comment_id_fkey', // Un nombre nuevo y descriptivo
        references: {
          table: 'commentarticles',
          field: 'comment_id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // La función 'down' revierte los cambios en el orden inverso.
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Primero, borramos la constraint que añadimos.
      await queryInterface.removeConstraint('comment_logs', 'comment_logs_comment_id_fkey', { transaction });

      // Luego, volvemos a hacer que la columna sea NOT NULL, como estaba originalmente.
      await queryInterface.changeColumn('comment_logs', 'comment_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};