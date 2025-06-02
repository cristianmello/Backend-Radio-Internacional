'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profile_change_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_code: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_code',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_code',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      field: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      old_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      new_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profile_change_logs');
  }
};
