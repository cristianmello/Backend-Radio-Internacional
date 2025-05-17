const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const CommentEdit = sequelize.define('CommentEdit', {
  edit_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  edit_comment_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  edit_editor_code: {
    type: DataTypes.INTEGER,
    allowNull: false
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
}, {
  timestamps: false,
  indexes: [
    { fields: ['edit_comment_code'] },
    { fields: ['edit_editor_code'] }
  ]
});

module.exports = CommentEdit;
