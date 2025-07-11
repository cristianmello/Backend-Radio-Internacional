// src/models/sectionAudioMap.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SectionAudioMap = sequelize.define('SectionAudioMap', {
    section_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sectionarticles', key: 'section_code' },
        primaryKey: true
    },
    audio_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'audios', key: 'audio_code' },
        primaryKey: true
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'sectionaudiomap',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['section_code', 'audio_code'],
            name: 'uix_section_audio'
        }
    ]
});

module.exports = SectionAudioMap;
