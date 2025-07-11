// seeders/20250617-seed-protected-sections.js
'use strict';

/**
 * Seeder para crear las secciones protegidas iniciales en el orden:
 * 1) breaking-news
 * 2) trending-news
 * 3) maincontent + sidebar agrupados en NewsLayout
 */
module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    // Añadir columna is_protected si no existe (manejar con migración separada)
    // queryInterface.addColumn('sectionarticles', 'is_protected', { ... });

    // Definición de secciones protegidas con posiciones:
    const sections = [
      {
        section_slug: 'breaking-news',
        section_title: 'Últimas Noticias',
        section_type: 'breaking',
        section_position: 1,
        is_protected: true
      },
      {
        section_slug: 'trending-news',
        section_title: 'Tendencias',
        section_type: 'trending',
        section_position: 2,
        is_protected: true
      },
      {
        section_slug: 'maincontent',
        section_title: 'Destacados',
        section_type: 'maincontent',
        section_position: 3,
        is_protected: true
      },
      {
        section_slug: 'sidebar',
        section_title: 'Barra Lateral',
        section_type: 'sidebar',
        section_position: 4,
        is_protected: true
      }
    ];

    for (const sec of sections) {
      const exists = await queryInterface.rawSelect(
        'sectionarticles',
        { where: { section_slug: sec.section_slug } },
        ['section_code']
      );

      if (exists) {
        await queryInterface.bulkUpdate(
          'sectionarticles',
          sec,
          { section_slug: sec.section_slug }
        );
      } else {
        await queryInterface.bulkInsert(
          'sectionarticles',
          [{ ...sec, created_at: now, updated_at: now }]
        );
      }
    }
  },

  down: async (queryInterface) => {
    const slugs = ['breaking-news', 'trending-news', 'maincontent', 'sidebar'];
    await queryInterface.bulkDelete(
      'sectionarticles',
      { section_slug: slugs }
    );
  }
};
