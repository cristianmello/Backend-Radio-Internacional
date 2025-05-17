const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const CommentArticle = sequelize.define('CommentArticle', {
  comment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  comment_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: "El contenido del comentario no puede ser nulo" },
      len: {
        args: [3],
        msg: "El comentario debe tener al menos 3 caracteres"
      }
    }
  },
  comment_article_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  comment_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  comment_created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  comment_is_approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  comment_has_offensive_language: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false,
  indexes: [
    { fields: ['comment_article_id'] },
    { fields: ['comment_user_id'] }
  ]
});

module.exports = CommentArticle;
