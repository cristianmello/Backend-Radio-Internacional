'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('audios', {
      audio_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      audio_title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      audio_slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: 'uq_audio_slug'
      },
      audio_duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      audio_url: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      audio_author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE'
      },
      audio_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articlecategories',
          key: 'category_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      audio_published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      audio_is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // índices adicionales
    await queryInterface.addIndex('audios', ['audio_author_id'], { name: 'idx_audio_author_id' });
    await queryInterface.addIndex('audios', ['audio_category_id'], { name: 'idx_audio_category_id' });
    await queryInterface.addIndex('audios', ['audio_slug'], { name: 'idx_audio_slug', unique: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('audios');
  }
};
