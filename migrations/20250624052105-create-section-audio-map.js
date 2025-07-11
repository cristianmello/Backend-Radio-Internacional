'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sectionaudiomap', {
      section_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'sectionarticles',
          key: 'section_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      audio_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'audios',
          key: 'audio_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });

    // Crear índice único manualmente
    await queryInterface.addConstraint('sectionaudiomap', {
      fields: ['section_code', 'audio_code'],
      type: 'unique',
      name: 'uix_section_audio'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sectionaudiomap');
  }
};
