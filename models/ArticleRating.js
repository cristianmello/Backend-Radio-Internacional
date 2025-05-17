const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const ArticleRating = sequelize.define('ArticleRating', {
    rating_code: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    rating_user_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_code'
        },
        onDelete: 'CASCADE'
    },
    rating_article_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'articles',
            key: 'article_code'
        },
        onDelete: 'CASCADE'
    },
    rating_value: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    rating_created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['rating_user_code', 'rating_article_code']
        },
        {
            fields: ['rating_user_code']
        },
        {
            fields: ['rating_article_code']
        }
    ]
});

module.exports = ArticleRating;
