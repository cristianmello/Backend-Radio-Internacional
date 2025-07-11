// src/controllers/audios/deleteAudio.js
const AudioLog = require('../../models/audio_log');
const Audio = require('../../models/audios');
const redisClient = require('../../services/redisclient');

/**
 * Borra todas las claves que casen con un patrón usando SCAN + DEL en bloques.
 */
async function clearByPattern(pattern) {
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) {
            await redisClient.del(...keys);
        }
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    const t = await Audio.sequelize.transaction();
    let transactionFinished = false;

    try {
        const { id } = req.params;

        // 1) Cargamos la nota de audio en la transacción
        const audio = await Audio.findByPk(id, { transaction: t });
        if (!audio) {
            await t.rollback();
            transactionFinished = true;
            return res.status(404).json({
                status: 'error',
                message: 'Nota de audio no encontrada.',
            });
        }

        // 2) Creamos el log antes de la eliminación
        if (req.user) {
            await AudioLog.create({
                user_id: req.user.id,
                audio_id: audio.audio_code,
                action: 'delete',
                details: JSON.stringify({
                    title: audio.audio_title,
                    slug: audio.audio_slug
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 3) Eliminamos la nota de audio
        await audio.destroy({ transaction: t });

        // 4) Confirmamos la transacción
        await t.commit();
        transactionFinished = true;

        // 5) Limpiamos caché en Redis
        await clearByPattern(`audio:${id}`);
        await clearByPattern('audios:*');
        await clearByPattern('draftsaudios:*');
        await clearByPattern('categories:all');

        return res.status(200).json({
            status: 'success',
            message: 'Nota de audio eliminada correctamente.',
        });
    } catch (error) {
        if (!transactionFinished) {
            await t.rollback();
        }
        console.error('[Audios][Delete]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar la nota de audio.',
        });
    }
};
