// src/models/audiolog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const AudioLog = sequelize.define('AudioLog', {
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
    audio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'audios',
            key: 'audio_code'
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
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'audio_logs',
    timestamps: false,
    underscored: true
});

module.exports = AudioLog;
