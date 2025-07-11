'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('short_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Usuario que realizó la acción'
      },
      short_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'shorts',
          key: 'short_code'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Short afectado por la acción'
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false,
        comment: 'Tipo de acción ejecutada'
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON con detalles de la operación'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Momento en que se registró el log'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('short_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_short_logs_action";'); // Limpieza del ENUM
  }
};
