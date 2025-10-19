'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // PASO 1: Modificar la columna user_code para permitir NULL  
      await queryInterface.changeColumn('role_change_logs', 'user_code', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      // PASO 2: Eliminar la constraint existente  
      await queryInterface.removeConstraint(
        'role_change_logs',
        'role_change_logs_ibfk_1',
        { transaction }
      );

      // PASO 3: Añadir la nueva constraint con ON DELETE SET NULL  
      await queryInterface.addConstraint('role_change_logs', {
        fields: ['user_code'],
        type: 'foreign key',
        name: 'role_change_logs_user_code_fkey',
        references: {
          table: 'users',
          field: 'user_code'
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
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Revertir: eliminar la nueva constraint  
      await queryInterface.removeConstraint(
        'role_change_logs',
        'role_change_logs_user_code_fkey',
        { transaction }
      );

      // Restaurar la constraint original con RESTRICT  
      await queryInterface.addConstraint('role_change_logs', {
        fields: ['user_code'],
        type: 'foreign key',
        name: 'role_change_logs_ibfk_1',
        references: {
          table: 'users',
          field: 'user_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      }, { transaction });

      // Volver a hacer la columna NOT NULL  
      await queryInterface.changeColumn('role_change_logs', 'user_code', {
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
