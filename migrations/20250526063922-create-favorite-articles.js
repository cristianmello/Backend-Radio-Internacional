'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FavoriteArticles', {
      favorite_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      favorite_user_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      favorite_article_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'article_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      favorite_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices
    await queryInterface.addIndex('FavoriteArticles', {
      unique: true,
      fields: ['favorite_user_code', 'favorite_article_code']
    });

    await queryInterface.addIndex('FavoriteArticles', ['favorite_user_code']);
    await queryInterface.addIndex('FavoriteArticles', ['favorite_article_code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('FavoriteArticles', ['favorite_user_code', 'favorite_article_code']);
    await queryInterface.removeIndex('FavoriteArticles', ['favorite_user_code']);
    await queryInterface.removeIndex('FavoriteArticles', ['favorite_article_code']);
    await queryInterface.dropTable('FavoriteArticles');
  }
};
