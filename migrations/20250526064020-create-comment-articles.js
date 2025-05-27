'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('commentarticles', {
      comment_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      comment_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      comment_article_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'article_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      comment_is_approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      comment_has_offensive_language: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });

    // Índices
    await queryInterface.addIndex('commentarticles', ['comment_article_id']);
    await queryInterface.addIndex('commentarticles', ['comment_user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('commentarticles', ['comment_article_id']);
    await queryInterface.removeIndex('commentarticles', ['comment_user_id']);
    await queryInterface.dropTable('commentarticles');
  }
};
