// migrations/20250613-create-section-shorts.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sectionshortmap', {
      section_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'sectionarticles', key: 'section_code' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      short_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'shorts', key: 'short_code' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('sectionshortmap');
  }
};
