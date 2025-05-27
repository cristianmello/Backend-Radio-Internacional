'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('articleratings', {
      rating_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      rating_user_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rating_article_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'article_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rating_value: {
        type: Sequelize.TINYINT,
        allowNull: false
      },
      rating_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices
    await queryInterface.addIndex('articleratings', {
      unique: true,
      fields: ['rating_user_code', 'rating_article_code']
    });

    await queryInterface.addIndex('articleratings', ['rating_user_code']);
    await queryInterface.addIndex('articleratings', ['rating_article_code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('articleratings', ['rating_user_code', 'rating_article_code']);
    await queryInterface.removeIndex('articleratings', ['rating_user_code']);
    await queryInterface.removeIndex('articleratings', ['rating_article_code']);
    await queryInterface.dropTable('articleratings');
  }
};
