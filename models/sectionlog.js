// src/models/sectionlog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SectionLog = sequelize.define('SectionLog', {
    sectionlog_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Usuario que realizó la acción',
        references: {
            model: 'users',
            key: 'user_code'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    section_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Sección afectada',
        references: {
            model: 'sectionarticles',
            key: 'section_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Acción realizada (create, delete, add_item, remove_item, reorder_items, etc.)'
    },
    details: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Detalles adicionales de la acción'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Momento en que se realizó la acción'
    }
}, {
    tableName: 'sectionlogs',
    timestamps: false,
    underscored: true,
    comment: 'Log de auditoría de acciones sobre secciones'
});

module.exports = SectionLog;
