const { validationResult } = require('express-validator');
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { category_name, category_slug } = req.body;

  const t = await ArticleCategory.sequelize.transaction();

  try {
    const category = await ArticleCategory.findByPk(id);
    if (!category) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada',
      });
    }

    if (category_slug && category_slug !== category.category_slug) {
      const existing = await ArticleCategory.findOne({
        where: { category_slug },
      });

      if (existing && existing.id !== category.id) {
        await t.rollback();
        return res.status(409).json({
          status: 'error',
          message: 'El slug ya está en uso por otra categoría.',
        });
      }
    }

    await category.update(
      { category_name, category_slug },
      { transaction: t }
    );

    await t.commit();

    await Promise.all([
      clearCacheByPattern('categories:*'),
      clearCacheByPattern('categories:all'),
      clearCacheByPattern('pages:home'),
      clearCacheByPattern('available_articles:*'),
      clearCacheByPattern('sections:*'),
      clearCacheByPattern('pages:*'),
      clearCacheByPattern('drafts:*'),
      clearCacheByPattern('shorts:drafts:*'),
      clearCacheByPattern('audios:*'),
      clearCacheByPattern('advertisements:*')
    ]);

    return res.status(200).json({
      status: 'success',
      message: 'Categoría actualizada correctamente.',
      category,
    });
  } catch (err) {
    await t.rollback();
    console.error('[Categories][Update]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al actualizar la categoría.',
    });
  }
};
