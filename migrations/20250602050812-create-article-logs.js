'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('article_logs', {
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
        onUpdate: 'CASCADE'
      },
      article_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'articles',
          key: 'article_code'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('article_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_article_logs_action";'); // Limpia el ENUM
  }
};
