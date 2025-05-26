'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('articlecategories', {
      category_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      category_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      category_slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Este campo se usa como parte de la URL para identificar la categoría"
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('articlecategories');
  }
};
