'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sectionlogs', {
      sectionlog_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Usuario que realizó la acción',
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      section_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Sección afectada',
        references: {
          model: 'sectionarticles',
          key: 'section_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Acción realizada (create, delete, add_item, etc.)'
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Detalles adicionales de la acción'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Momento en que se realizó la acción'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sectionlogs');
  }
};
