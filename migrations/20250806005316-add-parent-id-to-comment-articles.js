'use strict';


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('commentarticles', 'comment_parent_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'commentarticles',
          key: 'comment_id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      await queryInterface.addColumn('commentarticles', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }, { transaction });

      await queryInterface.addColumn('commentarticles', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, { transaction });

      await queryInterface.addIndex('commentarticles', ['comment_parent_id'], {
        name: 'idx_comment_parent',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('commentarticles', 'updated_at', { transaction });
      await queryInterface.removeColumn('commentarticles', 'created_at', { transaction });
      await queryInterface.removeColumn('commentarticles', 'comment_parent_id', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
