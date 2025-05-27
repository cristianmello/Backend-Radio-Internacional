'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role_change_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      old_role_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'role_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      new_role_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'role_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices opcionales si quieres mejorar búsquedas
    await queryInterface.addIndex('role_change_logs', ['user_code']);
    await queryInterface.addIndex('role_change_logs', ['old_role_code']);
    await queryInterface.addIndex('role_change_logs', ['new_role_code']);
    await queryInterface.addIndex('role_change_logs', ['changed_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('role_change_logs', ['user_code']);
    await queryInterface.removeIndex('role_change_logs', ['old_role_code']);
    await queryInterface.removeIndex('role_change_logs', ['new_role_code']);
    await queryInterface.removeIndex('role_change_logs', ['changed_by']);
    await queryInterface.dropTable('role_change_logs');
  }
};
