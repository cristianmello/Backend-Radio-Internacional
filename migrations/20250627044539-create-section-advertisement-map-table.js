'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('section_advertisement_map', {
      section_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'sectionarticles', // El nombre de tu tabla de secciones
          key: 'section_code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'advertisements',
          key: 'ad_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('section_advertisement_map');
  }
};