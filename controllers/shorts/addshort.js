// src/controllers/shortsController.js
const { Op } = require('sequelize');
const Short = require('../../models/short');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const ShortLog = require('../../models/shortlog');

module.exports = async (req, res) => {
  const t = await Short.sequelize.transaction();
  try {
    const {
      short_title,
      short_slug,
      short_video_url,
      short_duration,
      short_author_id,
      short_category_id,
      short_published_at,
      short_is_published
    } = req.body;

    // 0. Validar duración
    const durationSec = parseInt(short_duration, 10);
    if (isNaN(durationSec) || durationSec < 1) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'La duración (`short_duration`) debe ser un entero >= 1 (segundos).'
      });
    }

    // 1. Validar autor
    const author = await User.findByPk(short_author_id, { transaction: t });
    if (!author) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'El autor especificado no existe.'
      });
    }

    // 2. Validar categoría
    const category = await ArticleCategory.findByPk(short_category_id, { transaction: t });
    if (!category) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'La categoría especificada no existe.'
      });
    }

    // 3. Crear el short
    const newShort = await Short.create({
      short_title,
      short_slug,
      short_video_url,
      short_duration: durationSec,
      short_author_id,
      short_category_id,
      short_published_at: short_published_at || new Date(),
      short_is_published: typeof short_is_published === 'boolean'
        ? short_is_published
        : true
    }, { transaction: t });

    // 4. Registrar auditoría (opcional)
    if (req.user) {
      await ShortLog.create({
        user_id: req.user.id,
        short_id: newShort.short_code,
        action: 'create',
        details: JSON.stringify({
          title: newShort.short_title,
          slug: newShort.short_slug,
          video: newShort.short_video_url,
          duration: newShort.short_duration
        }),
        timestamp: new Date()
      }, { transaction: t });
    }

    // 5. Commit y limpiar caché
    await t.commit();
    const keys = await redisClient.keys('shorts:*');
    if (keys.length) {
      await Promise.all(keys.map(k => redisClient.del(k)));
    }

    return res.status(201).json({
      status: 'success',
      message: 'Short creado correctamente.',
      data: newShort
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error('[Shorts][Add]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al crear el short.'
    });
  }
};
