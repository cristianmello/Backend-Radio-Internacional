const { validationResult } = require('express-validator');
const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

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

    if (redisClient) {
      await redisClient.del(`category:${id}`);
      const keys = await redisClient.keys('categories:*');
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redisClient.del(key)));
      }
    }

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
