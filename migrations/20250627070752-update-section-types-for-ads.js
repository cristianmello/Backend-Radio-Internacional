// migrations/20250613-create-sectionarticles.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sectionarticles', {
      section_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      section_slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      section_title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      section_type: {
        type: Sequelize.ENUM(
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
          'ad-small',
          'ad-banner',
          'ad-skyscraper'
        ),
        allowNull: false
      },
      section_position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      section_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('sectionarticles');
  }
};