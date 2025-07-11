// src/controllers/shorts/deleteShort.js
const Short = require('../../models/short');
const ShortLog = require('../../models/shortlog');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    const t = await Short.sequelize.transaction();
    let transactionFinished = false;

    try {
        const { id } = req.params;

        const short = await Short.findByPk(id);
        if (!short) {
            await t.rollback();
            transactionFinished = true;
            return res.status(404).json({
                status: 'error',
                message: 'Short no encontrado.',
            });
        }

        await short.destroy({ transaction: t });

        if (req.user) {
            await ShortLog.create({
                user_id: req.user.id,
                short_id: short.short_code,
                action: 'delete',
                details: JSON.stringify({
                    title: short.short_title,
                    slug: short.short_slug,
                    video: short.short_video_url,
                    duration: short.short_duration
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();
        transactionFinished = true;

        // Limpiar caché individual y lista
        await redisClient.del(`short:${id}`);
        const keys = await redisClient.keys('shorts:*');
        if (keys.length) {
            await Promise.all(keys.map(k => redisClient.del(k)));
        }

        return res.status(200).json({
            status: 'success',
            message: 'Short eliminado correctamente.',
        });
    } catch (error) {
        if (!transactionFinished) await t.rollback();
        console.error('[Shorts][Delete]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el short.',
        });
    }
};
