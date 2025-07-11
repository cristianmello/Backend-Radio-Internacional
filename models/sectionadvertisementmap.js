const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SectionAdvertisementMap = sequelize.define('SectionAdvertisementMap', {
    // Clave foránea que apunta a la tabla de secciones
    section_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sectionarticles', key: 'section_code' },
        primaryKey: true
    },
    // La única diferencia clave: apunta a la nueva tabla 'advertisements'
    ad_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'advertisements', key: 'ad_id' }, // <-- Referencia a la tabla de anuncios
        primaryKey: true
    },
    // Campo crucial para poder ordenar los anuncios dentro de una sección
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'section_advertisement_map', // Nombre de la nueva tabla en la base de datos
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['section_code', 'ad_id'], // Asegura que no se pueda añadir el mismo anuncio dos veces a la misma sección
            name: 'uix_section_advertisement'
        }
    ]
});

module.exports = SectionAdvertisementMap;