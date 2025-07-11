const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

// Modelo para definir cada sección dinámica en HomePage
const SectionArticles = sequelize.define('SectionArticles', {
    section_code: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    section_slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Identificador único en URL o front'
    },
    section_title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Título a mostrar de la sección (opcional)'
    },
    section_type: {
        type: DataTypes.ENUM(
            'breaking',    // Últimas Noticias
            'maincontent',
            'trending',    // Tendencias / Lo más visto
            'sidebar',
            'featured',    //Destacado / Formato lista
            'world',       // Noticias del Mundo
            'mosaic',      // Destacados / Formato mosaico
            'video',       // En Video
            'shorts',      // Shorts
            'sideaudios',
            'popular',     // Más Leídos (sidebar popular-posts)
            'newsletter',  // Suscripción Newsletter widget
            'tags',        // Temas Populares (tag cloud)
            'gallery',     // Galería de imágenes
            'weather',      // Widget de Clima
            'ad-large',
            'ad-biglarge',
            'ad-small',
            'ad-verticalsm',
            'ad-banner',
            'ad-skyscraper'
        ),
        allowNull: false,
        comment: 'Tipo de sección para mapear componente'
    },
    section_position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden en que aparece en HomePage'
    },
    section_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        comment: 'Cantidad máxima de ítems en la sección'
    },
    is_protected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Marca si la sección es accesible sólo a usuarios autenticados'
    }
}, {
    tableName: 'sectionarticles', // nombre de tabla en BD
    timestamps: true,
    underscored: true,
    comment: 'Define las secciones dinámicas del Home'
});

module.exports = SectionArticles;
