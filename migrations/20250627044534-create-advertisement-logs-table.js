'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('advertisement_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Permitir nulo por si se borra el usuario
        references: {
          model: 'users',
          key: 'user_code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'advertisements',
          key: 'ad_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete', 'activate', 'deactivate'),
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('advertisement_logs');
  }
};