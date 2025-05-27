'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ArticleEdits', {
      edit_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      edit_article_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'article_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      edit_editor_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      edit_previous_title: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      edit_previous_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      edit_edited_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('ArticleEdits', ['edit_article_code']);
    await queryInterface.addIndex('ArticleEdits', ['edit_editor_code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ArticleEdits', ['edit_article_code']);
    await queryInterface.removeIndex('ArticleEdits', ['edit_editor_code']);
    await queryInterface.dropTable('ArticleEdits');
  }
};
