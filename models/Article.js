const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const Article = sequelize.define('Article', {
  article_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  article_title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notNull: { msg: "El título no puede ser nulo" },
      len: {
        args: [5, 200],
        msg: "El título debe tener entre 5 y 200 caracteres"
      }
    }
  },
  article_slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    comment: "Este campo se usa como parte de la URL para identificar el artículo",
    validate: {
      notNull: { msg: "El identificador para la URL no puede ser nulo" },
      is: {
        args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
        msg: "El identificador para la URL debe estar en minúsculas, sin espacios, y solo puede contener letras, números y guiones"
      }
    }
  },
  article_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: "El contenido no puede ser nulo" },
      len: {
        args: [10],
        msg: "El contenido debe tener al menos 10 caracteres"
      }
    }
  },
  article_image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: { msg: "Debe ser una URL válida para la imagen" }
    }
  },
  article_author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_code'
    },
    onDelete: 'CASCADE'
  },
  article_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'articlecategories',
      key: 'category_code'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  article_published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  article_is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  article_is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['article_author_id'] },
    { fields: ['article_category_id'] }
  ],
  tableName: 'articles'
});

module.exports = Article;
