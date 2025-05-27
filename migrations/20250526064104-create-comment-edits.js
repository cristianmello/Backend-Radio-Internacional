'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommentEdits', {
      edit_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      edit_comment_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'commentArticles',
          key: 'comment_id'
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

    // Índices
    await queryInterface.addIndex('CommentEdits', ['edit_comment_code']);
    await queryInterface.addIndex('CommentEdits', ['edit_editor_code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('CommentEdits', ['edit_comment_code']);
    await queryInterface.removeIndex('CommentEdits', ['edit_editor_code']);
    await queryInterface.dropTable('CommentEdits');
  }
};
