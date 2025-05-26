const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const ArticleRating = sequelize.define(
    'ArticleRating',
    {
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
                min: {
                    args: [1],
                    msg: "La calificación mínima es 1"
                },
                max: {
                    args: [5],
                    msg: "La calificación máxima es 5"
                },
                isInt: {
                    msg: "El valor de la calificación debe ser un número entero"
                }
            }
        },
        rating_created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'article_ratings',
        timestamps: false,
        indexes: [
            {
                name: 'unique_user_article_rating',
                unique: true,
                fields: ['rating_user_code', 'rating_article_code']
            },
            {
                name: 'idx_rating_user_code',
                fields: ['rating_user_code']
            },
            {
                name: 'idx_rating_article_code',
                fields: ['rating_article_code']
            }
        ]
    }
);

module.exports = ArticleRating;
