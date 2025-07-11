// src/models/Audio.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Audio = sequelize.define(
    "Audio",
    {
        audio_code: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        audio_title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notNull: { msg: "El título no puede ser nulo" },
                len: {
                    args: [5, 200],
                    msg: "El título debe tener entre 5 y 200 caracteres",
                },
            },
        },
        audio_slug: {
            type: DataTypes.STRING(200),
            allowNull: false,
            unique: {
                name: "uq_audio_slug",
                msg: "Ya existe una nota de audio con este slug",
            },
            comment: "Identificador en URL (único y amigable)",
            validate: {
                notNull: { msg: "El identificador para la URL no puede ser nulo" },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
                    msg: "El slug debe estar en minúsculas, sin espacios, y solo contener letras, números y guiones",
                },
                len: {
                    args: [5, 200],
                    msg: "El slug debe tener entre 5 y 200 caracteres",
                },
            },
        },
        audio_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Duración del audio en segundos",
            validate: {
                min: {
                    args: [1],
                    msg: "La duración debe ser de al menos 1 segundo",
                },
            },
        },
        audio_url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: { msg: "La URL del audio no puede ser nula" },
                isUrl: { msg: "Debe ser una URL válida para el audio" },
            },
        },
        audio_author_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "user_code",
            },
            onDelete: "CASCADE",
            comment: "Autor de la nota de audio",
        },
        audio_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "articlecategories",
                key: "category_code",
            },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
            comment: "Categoría a la que pertenece el audio",
        },
        audio_published_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "Fecha de publicación del audio",
        },
        audio_is_published: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "Indica si el audio está disponible públicamente",
        },
    },
    {
        tableName: "audios",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
        indexes: [
            {
                name: "idx_audio_author_id",
                fields: ["audio_author_id"],
            },
            {
                name: "idx_audio_category_id",
                fields: ["audio_category_id"],
            },
            {
                name: "idx_audio_slug",
                unique: true,
                fields: ["audio_slug"],
            },
        ],
        defaultScope: {
            attributes: { exclude: [] },
        },
        scopes: {
            published: {
                where: { audio_is_published: true },
            },
        },
    }
);

module.exports = Audio;
