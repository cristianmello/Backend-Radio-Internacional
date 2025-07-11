// src/models/sectionShortMap.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SectionShortMap = sequelize.define('SectionShortMap', {
  section_code: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'sectionarticles',
      key:   'section_code'
    }
  },
  short_code: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'shorts',
      key:   'short_code'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'sectionshortmap',
  timestamps: false,
  underscored: true,
  comment: 'Pivot Section <-> Short with position'
});

module.exports = SectionShortMap;
