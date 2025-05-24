const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const { id } = req.params;
  const t = await ArticleCategory.sequelize.transaction();

  try {
    const category = await ArticleCategory.findByPk(id);
    if (!category) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada.',
      });
    }

    await category.destroy({ transaction: t });
    await t.commit();

    // 🧹 Limpiar caché
    if (redisClient) {
      await redisClient.del(`category:${id}`);
      const keys = await redisClient.keys('categories:*');
      if (keys.length > 0) {
        await Promise.all(keys.map(k => redisClient.del(k)));
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
