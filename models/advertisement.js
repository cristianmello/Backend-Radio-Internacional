// models/advertisement.js

const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Advertisement = sequelize.define('Advertisement', {
    // --- Identificador Principal ---
    ad_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    // --- Campos de Gestión Interna ---
    ad_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre interno del anuncio no puede estar vacío.' },
            len: {
                args: [5, 150],
                msg: 'El nombre interno debe tener entre 5 y 150 caracteres.'
            }
        },
        comment: 'Nombre interno para identificar el anuncio en el admin panel (ej: "Banner Nike Verano 2025").'
    },
    ad_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción opcional para notas internas sobre la campaña o el anuncio.'
    },

    // --- Tipo y Contenido del Anuncio ---
    ad_type: {
        type: DataTypes.ENUM('image', 'script'),
        allowNull: false,
        defaultValue: 'image',
        comment: 'Define si el anuncio es una imagen con enlace o un script (ej. Google AdSense).'
    },

    ad_format: {
        type: DataTypes.ENUM(
            'mrec',
            'large-rectangle',
            'skyscraper',
            'square',
            'default',
            'biglarge-rectangle',
            'vertical'
        ),
        allowNull: true,
        comment: 'Define el tamaño/formato del anuncio de imagen (ej: "leaderboard").'
    },

    ad_image_url: {
        type: DataTypes.STRING(255),
        allowNull: true, // Es nulo si el tipo es 'script'
        validate: {
            isUrl: { msg: 'La URL de la imagen del anuncio debe ser una URL válida.' }
        }
    },
    ad_target_url: {
        type: DataTypes.STRING(255),
        allowNull: true, // Es nulo si el tipo es 'script'
        comment: 'URL de destino al hacer clic en un anuncio de tipo imagen.',
        validate: {
            isUrl: { msg: 'La URL de destino del anuncio debe ser una URL válida.' }
        }
    },
    ad_script_content: {
        type: DataTypes.TEXT,
        allowNull: true, // Es nulo si el tipo es 'image'
        comment: 'Contenido del script para anuncios (ej. Google AdSense).'
    },

    // --- Control de Estado y Programación ---
    ad_is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Controla si el anuncio está activo y puede ser mostrado.'
    },
    ad_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha opcional de inicio de la campaña del anuncio.'
    },
    ad_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha opcional de fin de la campaña del anuncio.'
    },

    // --- Campos para Futura Escalabilidad (Tracking) ---
    ad_impressions: {
        type: DataTypes.INTEGER.UNSIGNED, // No puede ser negativo
        allowNull: false,
        defaultValue: 0,
        comment: 'Contador de cuántas veces se ha mostrado el anuncio.'
    },
    ad_clicks: {
        type: DataTypes.INTEGER.UNSIGNED, // No puede ser negativo
        allowNull: false,
        defaultValue: 0,
        comment: 'Contador de cuántas veces se ha hecho clic en el anuncio.'
    }
}, {
    tableName: 'advertisements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,

    // Índices para mejorar el rendimiento de las consultas en producción
    indexes: [
        {
            name: 'idx_ad_is_active',
            fields: ['ad_is_active']
        },
        {
            name: 'idx_ad_type_and_dates',
            fields: ['ad_type', 'ad_is_active', 'ad_start_date', 'ad_end_date']
        }
    ],

    // Validaciones a nivel de modelo para asegurar la coherencia de los datos
    validate: {
        contentIsRequiredForType() {
            if (this.ad_type === 'image') {
                if (!this.ad_image_url || !this.ad_target_url) {
                    throw new Error('Para un anuncio de tipo "imagen", se requieren la URL de la imagen y la URL de destino.');
                }
            } else if (this.ad_type === 'script') {
                if (!this.ad_script_content) {
                    throw new Error('Para un anuncio de tipo "script", se requiere el contenido del script.');
                }
            }
        },
        endDateAfterStartDate() {
            if (this.ad_start_date && this.ad_end_date) {
                if (new Date(this.ad_end_date) < new Date(this.ad_start_date)) {
                    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
                }
            }
        }
    }
});

module.exports = Advertisement;