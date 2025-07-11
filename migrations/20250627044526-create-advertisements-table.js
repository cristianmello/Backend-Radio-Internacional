'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('advertisements', {
      ad_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ad_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      ad_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ad_type: {
        type: Sequelize.ENUM('image', 'script'),
        allowNull: false,
        defaultValue: 'image',
      },
      ad_format: {
        type: Sequelize.ENUM(
          'mrec',
          'large-rectangle',
          'skyscraper',
          'square',
          'default',
          'biglarge-rectangle',
          'vertical'
        ),
        allowNull: true,
        comment: 'Define el tamaño/formato del anuncio de imagen.'
      },
      ad_image_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ad_target_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ad_script_content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ad_is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ad_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ad_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ad_impressions: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      ad_clicks: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('advertisements');
  }
};