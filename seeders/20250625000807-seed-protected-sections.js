'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    const section = {
      section_slug: 'sideaudios',
      section_title: 'Notas de Audio',
      section_type: 'sideaudios',
      section_position: 5,
      is_protected: true
    };

    const exists = await queryInterface.rawSelect(
      'sectionarticles',
      { where: { section_slug: section.section_slug } },
      ['section_code']
    );

    if (exists) {
      await queryInterface.bulkUpdate(
        'sectionarticles',
        { ...section, updated_at: now },
        { section_slug: section.section_slug }
      );
    } else {
      await queryInterface.bulkInsert(
        'sectionarticles',
        [{ ...section, created_at: now, updated_at: now }]
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      'sectionarticles',
      { section_slug: 'sideaudios' }
    );
  }
};
