// src/models/sectionArticleMap.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SectionArticleMap = sequelize.define('SectionArticleMap', {
    section_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sectionarticles', key: 'section_code' },
        primaryKey: true
    },
    article_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'articles', key: 'article_code' },
        primaryKey: true
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'sectionarticlemap',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['section_code', 'article_code'],
            name: 'uix_section_article'
        }
    ]
});

module.exports = SectionArticleMap;
