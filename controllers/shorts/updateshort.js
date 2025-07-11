// src/controllers/shorts/updateShort.js
const Short = require('../../models/short');
const ShortLog = require('../../models/shortlog');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
  const t = await Short.sequelize.transaction();

  try {
    const { id } = req.params;
    const short = await Short.findByPk(id);

    if (!short) {
      await t.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Short no encontrado.',
      });
    }

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

    // Validar duración si se pasa
    if (short_duration !== undefined) {
      const durationSec = parseInt(short_duration, 10);
      if (isNaN(durationSec) || durationSec < 1) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'La duración (`short_duration`) debe ser un entero >= 1 (segundos).'
        });
      }
    }

    // Validar autor si cambia
    if (short_author_id && short_author_id !== short.short_author_id) {
      const author = await User.findByPk(short_author_id);
      if (!author) {
        await t.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'El nuevo autor especificado no existe.'
        });
      }
    }

    // Validar categoría si cambia
    if (short_category_id && short_category_id !== short.short_category_id) {
      const category = await ArticleCategory.findByPk(short_category_id);
      if (!category) {
        await t.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'La nueva categoría especificada no existe.'
        });
      }
    }

    const updatedFields = {
      short_title,
      short_slug,
      short_video_url,
      short_duration,
      short_author_id,
      short_category_id,
      short_published_at,
      short_is_published
    };

    // Eliminar campos `undefined` para no sobrescribir con `null`
    Object.keys(updatedFields).forEach(key => {
      if (updatedFields[key] === undefined) delete updatedFields[key];
    });

    await short.update(updatedFields, { transaction: t });

    // Crear log
    if (req.user && Number.isInteger(req.user.user_code)) {
      await ShortLog.create({
        user_id: req.user.user_code,
        short_id: id,
        action: 'update',
        details: JSON.stringify({
          updated_fields: Object.keys(updatedFields),
          updated_values: updatedFields
        }),
        timestamp: new Date()
      }, { transaction: t });
    }

    await t.commit();

    // Limpieza de Redis
    try {
      const keys = await redisClient.keys('shorts:*');
      await Promise.all([
        redisClient.del(`short:${id}`),
        ...keys.map(k => redisClient.del(k))
      ]);
    } catch (redisErr) {
      console.error('[Shorts][Update][RedisCleanup]', redisErr);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Short actualizado correctamente.',
      short
    });

  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error('[Shorts][Update]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al actualizar el short.'
    });
  }
};
