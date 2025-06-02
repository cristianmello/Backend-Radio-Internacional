'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('register_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_mail: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      register_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('register_logs');
  }
};
