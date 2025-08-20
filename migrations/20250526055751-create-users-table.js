'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      user_code: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      user_lastname: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      user_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      user_mail: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      user_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      user_image: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'https://realidadnacional.b-cdn.net/profile-images/default.webp'
      },
      user_password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role_code: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'roles',
          key: 'role_code'
        },
        onDelete: 'RESTRICT'
      },
      is_vip: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('users', ['is_vip']);
    await queryInterface.addIndex('users', ['is_verified']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
