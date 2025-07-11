'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('articles', {
      article_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      article_title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      article_slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
        comment: "Este campo se usa como parte de la URL para identificar el artículo"
      },
      article_excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Breve resumen o extracto del artículo'
      },
      article_content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      article_image_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      article_author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE'
      },
      article_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articlecategories',
          key: 'category_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      article_published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      article_is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      article_is_premium: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('articles');
  }
};
