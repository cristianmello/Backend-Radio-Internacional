const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection")

const CommentArticle = sequelize.define(
  'CommentArticle',
  {
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
    comment_parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'commentarticles',
        key: 'comment_id'
      },
      onDelete: 'CASCADE' // Si se borra el padre, se borran sus respuestas
    },
    comment_article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'articles',
        key: 'article_code'
      },
      onDelete: 'CASCADE'
    },
    comment_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_code'
      },
      onDelete: 'CASCADE'
    },
    comment_is_approved: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    comment_has_offensive_language: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'commentarticles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_comment_article',
        fields: ['comment_article_id']
      },
      {
        name: 'idx_comment_user',
        fields: ['comment_user_id']
      },
      {
        name: 'idx_comment_parent',
        fields: ['comment_parent_id']
      }
    ]
  }
);

module.exports = CommentArticle