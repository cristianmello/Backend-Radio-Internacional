'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comment_votes', {
      vote_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      vote_type: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      comment_id: { // Clave foránea para el comentario
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'commentarticles', key: 'comment_id' },
        onDelete: 'CASCADE'
      },
      user_id: { // Clave foránea para el usuario
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_code' },
        onDelete: 'CASCADE'
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    // Añadimos el índice único después de crear la tabla
    await queryInterface.addIndex('comment_votes', ['comment_id', 'user_id'], {
      unique: true,
      name: 'unique_user_comment_vote'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comment_votes');
  }
};