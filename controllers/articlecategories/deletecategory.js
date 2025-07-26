// src/controllers/categories/deleteCategory.js
const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

async function clearCacheByPattern(pattern) {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      if (keys.length) {
        await redisClient.del(...keys);
      }
      cursor = nextCursor;
    } while (cursor !== '0');
  } catch (e) {
    console.warn(`[Cache] Error limpiando el patrón "${pattern}":`, e);
  }
}
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
    await Promise.all([
      clearCacheByPattern('categories:all'),
      clearCacheByPattern(`category:${id}`),
      clearCacheByPattern('pages:home'),
      clearCacheByPattern('available_articles:*')
    ]);

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
