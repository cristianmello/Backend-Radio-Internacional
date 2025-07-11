// src/models/short.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Short = sequelize.define(
    'Short',
    {
        short_code: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        short_title: {
            type: DataTypes.STRING(200),
            allowNull: true,
            validate: {
                len: {
                    args: [3, 200],
                    msg: 'El título debe tener entre 3 y 200 caracteres'
                }
            }
        },
        short_slug: {
            type: DataTypes.STRING(200),
            allowNull: false,
            unique: {
                name: 'uq_short_slug',
                msg: 'Ya existe un short con este slug'
            },
            comment: 'Identificador en URL (solo minúsculas, números y guiones)',
            validate: {
                notNull: { msg: 'El identificador para la URL no puede ser nulo' },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
                    msg: 'El slug debe estar en minúsculas, sin espacios, y solo contener letras, números y guiones'
                },
                len: {
                    args: [3, 200],
                    msg: 'El slug debe tener entre 3 y 200 caracteres'
                }
            }
        },
        short_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'La duración debe ser al menos 1 segundo'
                }
            },
            comment: 'Duración del vídeo en segundos'
        },
        short_video_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: 'La URL del video no puede ser nula' },
                isUrl: { msg: 'Debe ser una URL válida para el video' }
            }
        },
        short_author_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_code'
            },
            onDelete: 'CASCADE',
            comment: 'Autor del short'
        },
        short_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'articlecategories',
                key: 'category_code'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Categoría a la que pertenece el short'
        },
        short_published_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Fecha de publicación'
        },
        short_is_published: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Indica si el short está público'
        }
    },
    {
        tableName: 'shorts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        indexes: [
            {
                name: 'idx_short_author_id',
                fields: ['short_author_id']
            },
            {
                name: 'idx_short_category_id',
                fields: ['short_category_id']
            },
            {
                name: 'idx_short_slug',
                unique: true,
                fields: ['short_slug']
            }
        ],
        defaultScope: {
            attributes: { exclude: [] }
        },
        scopes: {
            published: {
                where: { short_is_published: true }
            }
        }
    }
);

module.exports = Short;
