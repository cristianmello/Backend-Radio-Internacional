'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('memberships', {
      membership_code: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_code'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'expired'),
        allowNull: false,
        defaultValue: 'active'
      }
    });

    // Agregar índices
    await queryInterface.addIndex('memberships', ['user_code']);
    await queryInterface.addIndex('memberships', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('memberships', ['user_code']);
    await queryInterface.removeIndex('memberships', ['status']);
    await queryInterface.dropTable('memberships');
  }
};
