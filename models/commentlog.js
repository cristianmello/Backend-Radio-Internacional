// models/commentLog.js

const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const CommentLog = sequelize.define('CommentLog', {
    log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Quién hizo la acción
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_code'
        }
    },
    // Sobre qué comentario se hizo la acción
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'commentarticles', // La tabla de comentarios
            key: 'comment_id'
        },
        onDelete: 'SET NULL'
    },
    // Qué acción se realizó
    action: {
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false
    },
    // Detalles adicionales (ej. el contenido antes y después de un cambio)
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Cuándo se realizó
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'comment_logs',
    timestamps: false,
    underscored: true
});

module.exports = CommentLog;