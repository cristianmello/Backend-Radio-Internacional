const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const ArticleCategory = sequelize.define('ArticleCategory', {
  category_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: "El nombre de la categoría no puede ser nulo" },
      len: {
        args: [3, 100],
        msg: "El nombre debe tener entre 3 y 100 caracteres"
      },
      is: {
        args: [/^[a-zñáéíóú\s]+$/i],
        msg: "El nombre solo puede contener letras, acentos, la letra 'ñ' y espacios"
      }
    }
  },
  category_slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: "Este campo se usa como parte de la URL para identificar la categoría",
    validate: {
      notNull: { msg: "El identificador para la URL no puede ser nulo" },
      is: {
        args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
        msg: "El slug debe estar en minúsculas, sin espacios, y solo puede contener letras, números y guiones"
      }
    }
  }
}, {
  tableName: 'articlecategories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['category_name'] },
    { unique: true, fields: ['category_slug'] }
  ]
});

module.exports = ArticleCategory;
