'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shorts', {
      short_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      short_title: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Título del short (opcional)'
      },
      short_slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
        comment: 'Identificador en URL (solo minúsculas, números y guiones)'
      },
      short_duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Duración del video en segundos'
      },
      short_video_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'URL del video del short'
      },
      short_author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        comment: 'Autor del short'
      },
      short_category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articlecategories',
          key: 'category_code'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        comment: 'Categoría a la que pertenece el short'
      },
      short_published_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha de publicación'
      },
      short_is_published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Indica si el short está publicado'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices adicionales
    await queryInterface.addIndex('shorts', ['short_slug'], {
      name: 'idx_short_slug',
      unique: true
    });

    await queryInterface.addIndex('shorts', ['short_author_id'], {
      name: 'idx_short_author_id'
    });

    await queryInterface.addIndex('shorts', ['short_category_id'], {
      name: 'idx_short_category_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('shorts');
  }
};
