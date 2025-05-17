const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const FavoriteArticle = sequelize.define('FavoriteArticle', {
  favorite_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  favorite_user_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_code'
    },
    onDelete: 'CASCADE'
  },
  favorite_article_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'articles',
      key: 'article_code'
    },
    onDelete: 'CASCADE'
  },
  favorite_created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['favorite_user_code', 'favorite_article_code']
    },
    { fields: ['favorite_user_code'] },
    { fields: ['favorite_article_code'] }
  ]
});

module.exports = FavoriteArticle;
