// src/controllers/categories/createCategory.js
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

  const { category_name, category_slug } = req.body;
  const t = await ArticleCategory.sequelize.transaction();

  try {
    const existing = await ArticleCategory.findOne({
      where: { category_slug },
      transaction: t
    });
    if (existing) {
      await t.rollback();
      return res.status(409).json({
        status: 'error',
        message: 'El slug ya está en uso.',
      });
    }

    const newCategory = await ArticleCategory.create(
      { category_name, category_slug },
      { transaction: t }
    );
    await t.commit();

    // Invalida sólo el listado de categorías
    if (redisClient) {
      try {
        await redisClient.del('categories:all');
      } catch (e) {
        console.warn('[Redis] No se pudo invalidar categories:all', e);
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Categoría creada correctamente.',
      category: newCategory,
    });
  } catch (err) {
    await t.rollback();
    console.error('[Categories][Create]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno al crear la categoría.',
    });
  }
};
