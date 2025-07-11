// models/advertisement_log.js

const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const AdvertisementLog = sequelize.define('AdvertisementLog', {
    log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Referencia a la tabla de usuarios
            key: 'user_code'
        },
        comment: 'ID del usuario que realizó la acción.'
    },
    // --- La única diferencia clave con ArticleLog ---
    ad_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Debería ser 'false' para siempre saber a qué anuncio se refiere
        references: {
            model: 'advertisements', // Referencia a tu nueva tabla de anuncios
            key: 'ad_id'
        },
        comment: 'ID del anuncio que fue afectado.'
    },
    action: {
        type: DataTypes.ENUM('create', 'update', 'delete', 'activate', 'deactivate'), // Ampliamos con acciones específicas de anuncios
        allowNull: false,
        comment: 'La acción realizada sobre el anuncio.'
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detalles en formato JSON sobre los cambios realizados (ej. campo, valor_anterior, valor_nuevo).'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'advertisement_logs',
    timestamps: false,
    underscored: true
});

module.exports = AdvertisementLog;