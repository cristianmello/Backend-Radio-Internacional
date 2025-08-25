// src/controllers/audios/deleteAudio.js
const AudioLog = require('../../models/audio_log');
const Audio = require('../../models/audios');
const redisClient = require('../../services/redisclient');
const { deleteFromBunny } = require('../../services/bunnystorage');

async function clearByPattern(pattern) {
    if (!redisClient) return;
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

    try {
        const { id } = req.params;

        const audio = await Audio.findByPk(id, { transaction: t });
        if (!audio) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Nota de audio no encontrada.',
            });
        }

        // 1. Guardamos la URL del archivo ANTES de borrar el registro
        const audioUrlToDelete = audio.audio_url;

        // Creamos el log antes de la eliminación
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

        // Eliminamos la nota de audio de la base de datos
        await audio.destroy({ transaction: t });

        // Confirmamos la transacción
        await t.commit();

        // 2. DESPUÉS del commit, borramos el archivo de BunnyCDN
        //    Lo hacemos de forma "fire-and-forget" para que la respuesta al usuario sea rápida.
        if (audioUrlToDelete) {
            deleteFromBunny(audioUrlToDelete).catch(err =>
                console.error(`Fallo al eliminar archivo de BunnyCDN: ${audioUrlToDelete}`, err)
            );
        }

        // Limpiamos caché en Redis
        await clearByPattern(`audio:${id}`);
        await clearByPattern('audios:*');
        await clearByPattern('draftsaudios:*');
        await clearByPattern('categories:all');

        return res.status(200).json({
            status: 'success',
            message: 'Nota de audio eliminada correctamente.',
        });
    } catch (error) {
        // 3. Simplificamos el manejo de errores
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('[Audios][Delete]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar la nota de audio.',
        });
    }
};