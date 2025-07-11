// migrations/20250613-create-section-articles.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sectionarticlemap', {
      section_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'sectionarticles', key: 'section_code' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      article_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'articles', key: 'article_code' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      // Aquí definimos el unique key compuesto
      uniqueKeys: {
        uix_section_article: {
          fields: ['section_code', 'article_code']
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sectionarticlemap');
  }
};
