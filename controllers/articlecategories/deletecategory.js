// src/controllers/categories/deleteCategory.js
const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const { id } = req.params;
  const t = await ArticleCategory.sequelize.transaction();

  try {
    const category = await ArticleCategory.findByPk(id, { transaction: t });
    if (!category) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada.',
      });
    }

    await category.destroy({ transaction: t });
    await t.commit();

    // Invalida sólo el listado de categorías
    if (redisClient) {
      try {
        await redisClient.del(`category:${id}`);
        await redisClient.del('categories:all');
      } catch (e) {
        console.warn('[Redis] No se pudo invalidar categories:all', e);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Categoría eliminada correctamente.',
    });
  } catch (err) {
    await t.rollback();
    console.error('[Categories][Delete]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al eliminar la categoría.',
    });
  }
};
