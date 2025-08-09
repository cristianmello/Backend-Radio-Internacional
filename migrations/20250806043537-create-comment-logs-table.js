'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comment_logs', {
      log_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_code' }
      },
      comment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'commentarticles', key: 'comment_id' },
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false
      },
      details: { type: Sequelize.TEXT, allowNull: true },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comment_logs');
  }
};