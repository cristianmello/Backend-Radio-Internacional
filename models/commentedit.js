const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const CommentEdit = sequelize.define(
  'CommentEdit',
  {
    edit_code: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    edit_comment_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'comment_articles',
        key: 'comment_id'
      },
      onDelete: 'CASCADE'
    },
    edit_editor_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_code'
      },
      onDelete: 'CASCADE'
    },
    edit_previous_content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    edit_edited_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'comment_edits',
    timestamps: false,
    indexes: [
      {
        name: 'idx_edit_comment_code',
        fields: ['edit_comment_code']
      },
      {
        name: 'idx_edit_editor_code',
        fields: ['edit_editor_code']
      }
    ]
  }
);

module.exports = CommentEdit;
