'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audio_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE'
      },
      audio_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'audios',
          key: 'audio_code'
        },
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audio_logs');
    // ⚠️ Eliminado DROP TYPE porque solo aplica en PostgreSQL, no en MySQL.
  }
};
