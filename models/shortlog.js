// src/models/shortlog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const ShortLog = sequelize.define('ShortLog', {
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
        },
        comment: 'Usuario que realizó la acción'
    },
    short_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'shorts',
            key: 'short_code'
        },
        comment: 'Short afectado por la acción'
    },
    action: {
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false,
        comment: 'Tipo de acción ejecutada'
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON con detalles de la operación'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Momento en que se registró el log'
    }
}, {
    tableName: 'short_logs',
    timestamps: false,
    underscored: true
});

module.exports = ShortLog;
