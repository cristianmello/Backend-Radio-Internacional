// src/controllers/audios/updateAudio.js
const Audio = require('../../models/audios');
const AudioLog = require('../../models/audio_log');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');
const { promises: fsp } = require('fs');
const redisClient = require('../../services/redisclient');
const { uploadToBunny, deleteFromBunny } = require('../../services/bunnystorage');

async function clearByPattern(pattern) {
    if (!redisClient) return;
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) await redisClient.del(...keys);
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    const t = await Audio.sequelize.transaction();
    const tempFilePath = req.processedAudio ? req.processedAudio.originalPath : null;
    let newAudioUrl = null;

    try {
        const { id } = req.params;
        const audio = await Audio.findByPk(id, { transaction: t });

        if (!audio) {
            throw { status: 404, message: 'Nota de audio no encontrada.' };
        }

        const updateData = {};
        const { audio_title, audio_slug, audio_author_id, audio_category_id } = req.body;

        // 1. Validaciones de Autor y Categoría (mantenemos tu lógica)
        if (audio_author_id && audio_author_id !== audio.audio_author_id) {
            const authorExists = await User.findByPk(audio_author_id, { transaction: t });
            if (!authorExists) throw { status: 404, message: 'Autor no existe.' };
        }
        if (audio_category_id && audio_category_id !== audio.audio_category_id) {
            const categoryExists = await ArticleCategory.findByPk(audio_category_id, { transaction: t });
            if (!categoryExists) throw { status: 404, message: 'Categoría no existe.' };
        }

        // Construimos el objeto de actualización explícitamente
        if (audio_title !== undefined) updateData.audio_title = audio_title;
        if (audio_slug !== undefined) updateData.audio_slug = audio_slug;
        if (audio_author_id !== undefined) updateData.audio_author_id = audio_author_id;
        if (audio_category_id !== undefined) updateData.audio_category_id = audio_category_id;

        const oldAudioUrl = audio.audio_url;

        // 2. Manejo de archivo desde el disco
        if (req.processedAudio) {
            const { filename, duration, isFallback } = req.processedAudio;
            const bufferToUpload = isFallback
                ? await fsp.readFile(tempFilePath)
                : req.processedAudio.buffer;

            newAudioUrl = await uploadToBunny(bufferToUpload, 'article-audios/', filename);
            updateData.audio_url = newAudioUrl;

            if (duration != null && duration >= 1) {
                updateData.audio_duration = duration;
            }
        }

        // 3. Aplicamos cambios y registramos el log (si hay algo que actualizar)
        if (Object.keys(updateData).length > 0) {
            await audio.update(updateData, { transaction: t });

            // Mantenemos tu formato de log original para no afectar el frontend
            await AudioLog.create({
                user_id: Number(req.user.id),
                audio_id: id,
                action: 'update',
                details: JSON.stringify({ fields: Object.keys(updateData) }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();

        if (newAudioUrl && oldAudioUrl) {
            deleteFromBunny(oldAudioUrl).catch(err => console.error("Fallo al eliminar audio antiguo de Bunny:", err));
        }

        // 4. Mantenemos tu lista completa de invalidaciones de caché
        await clearByPattern(`audio:${id}`);
        await clearByPattern('audios:*');
        await clearByPattern('draftsaudios:*');
        await clearByPattern('categories:all');
        await clearByPattern('sections:*');

        return res.status(200).json({
            status: 'success',
            message: 'Nota de audio actualizada correctamente.',
            audio
        });

    } catch (err) {
        if (t && !t.finished) await t.rollback();

        if (newAudioUrl) {
            await deleteFromBunny(newAudioUrl).catch(e => console.error("Error eliminando nuevo audio tras fallo:", e));
        }

        console.error('[Audios][Update]', err);
        const statusCode = err.status || 500;
        const message = err.message || 'Error al actualizar la nota de audio.';
        return res.status(statusCode).json({ status: 'error', message });
    } finally {
        if (tempFilePath) {
            await fsp.unlink(tempFilePath).catch(e => console.error("Error al limpiar archivo temporal en actualización:", e));
        }
    }
};