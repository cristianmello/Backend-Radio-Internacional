const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const ArticleLog = sequelize.define('ArticleLog', {
  log_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_code'
    }
  },
  article_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'articles',
      key: 'article_code'
    }
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'article_logs',
  timestamps: false,
  underscored: true
});

module.exports = ArticleLog;
