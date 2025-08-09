'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Borramos AMBAS constraints existentes para limpiar la tabla.
      await queryInterface.removeConstraint('comment_logs', 'comment_logs_ibfk_2', { transaction });
      await queryInterface.removeConstraint('comment_logs', 'comment_logs_ibfk_3', { transaction });

      // 2. Modificamos la columna para que permita valores nulos.
      await queryInterface.changeColumn('comment_logs', 'comment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      // 3. Añadimos una única y nueva constraint con la regla correcta.
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
    // La función 'down' revierte los cambios al estado original (CASCADE).
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('comment_logs', 'comment_logs_comment_id_fkey', { transaction });

      await queryInterface.changeColumn('comment_logs', 'comment_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }, { transaction });

      await queryInterface.addConstraint('comment_logs', {
        fields: ['comment_id'],
        type: 'foreign key',
        name: 'comment_logs_ibfk_2', // Volvemos a poner el nombre original
        references: { table: 'commentarticles', field: 'comment_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};