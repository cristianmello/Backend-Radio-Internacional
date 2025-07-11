// src/controllers/audios/updateAudio.js
const Audio = require('../../models/audios');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const AudioLog = require('../../models/audio_log');
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
    try {
        const { id } = req.params;
        const audio = await Audio.findByPk(id, { transaction: t });
        if (!audio) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Nota de audio no encontrada.' });
        }

        // Ya no se extraen 'audio_is_published' ni 'audio_published_at' del body
        const {
            audio_title,
            audio_slug,
            audio_duration,
            audio_author_id,
            audio_category_id
        } = req.body;

        // Validaciones de autor y categoría si se modifican
        if (audio_author_id && audio_author_id !== audio.audio_author_id) {
            const authorExists = await User.findByPk(audio_author_id, { transaction: t });
            if (!authorExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Autor no existe.' });
            }
        }
        if (audio_category_id && audio_category_id !== audio.audio_category_id) {
            const categoryExists = await ArticleCategory.findByPk(audio_category_id, { transaction: t });
            if (!categoryExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Categoría no existe.' });
            }
        }

        const allowed = [
            'audio_title',
            'audio_slug',
            'audio_duration',
            'audio_author_id',
            'audio_category_id'
        ];
        const updatedFields = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) updatedFields[field] = req.body[field];
        }

        // Validar y parsear duración si viene
        if (updatedFields.audio_duration !== undefined) {
            const dur = parseInt(updatedFields.audio_duration, 10);
            if (isNaN(dur) || dur < 1) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'La duración (`audio_duration`) debe ser un entero >= 1 (segundos).'
                });
            }
            updatedFields.audio_duration = dur;
        }

        // Manejar nuevo archivo de audio si se sube uno
        if (req.processedAudio) {
            const oldUrl = audio.audio_url;
            if (oldUrl && !oldUrl.includes('default')) {
                await deleteFromBunny(oldUrl).catch(e => console.error('Delete audio error', e));
            }
            const newUrl = await uploadToBunny(
                req.processedAudio.buffer,
                'article-audios/', // Ruta correcta para audios
                req.processedAudio.filename
            );
            updatedFields.audio_url = newUrl;
        }

        // Aplicar los cambios al audio en la base de datos
        await audio.update(updatedFields, { transaction: t });

        // Registrar el log de la actualización
        if (req.user && Number.isInteger(req.user.id)) {
            await AudioLog.create({
                user_id: req.user.id,
                audio_id: id,
                action: 'update',
                details: JSON.stringify({ fields: Object.keys(updatedFields) }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();

        // Invalidar todas las cachés relevantes
        try {
            await clearByPattern(`audio:${id}`); // Caché del audio individual
            await clearByPattern('audios:*'); // Cachés de listas de audios publicados
            await clearByPattern('draftsaudios:*'); // Caché de la lista de borradores
            await clearByPattern('categories:all'); // El contenido de las categorías puede cambiar
            await clearByPattern('sections:*'); // El contenido de las secciones puede cambiar
        } catch (cacheErr) {
            console.error('Redis cleanup error', cacheErr);
        }

        return res.status(200).json({ status: 'success', message: 'Nota de audio actualizada.', audio });
    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error('[Audios][Update]', err);
        return res.status(500).json({ status: 'error', message: 'Error al actualizar nota de audio.' });
    }
};

/*// src/controllers/audios/updateAudio.js
const Audio = require('../../models/audios');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const AudioLog = require('../../models/audio_log');
const redisClient = require('../../services/redisclient');
const { uploadToBunny, deleteFromBunny } = require('../../services/bunnystorage');

// Util: limpia claves con SCAN para no bloquear en producción
async function clearByPattern(pattern) {
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) await redisClient.del(...keys);
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
            return res.status(404).json({ status: 'error', message: 'Nota de audio no encontrada.' });
        }

        // Campos permitidos
        const {
            audio_title,
            audio_slug,
            audio_duration,
            audio_author_id,
            audio_category_id,
            audio_published_at,
            audio_is_published
        } = req.body;

        // Validar autor si cambió
        if (audio_author_id && audio_author_id !== audio.audio_author_id) {
            const authorExists = await User.findByPk(audio_author_id, { transaction: t });
            if (!authorExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Autor no existe.' });
            }
        }

        // Validar categoría si cambió
        if (audio_category_id && audio_category_id !== audio.audio_category_id) {
            const categoryExists = await ArticleCategory.findByPk(audio_category_id, { transaction: t });
            if (!categoryExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Categoría no existe.' });
            }
        }

        // Reconstruir objeto solo con campos presentes
        const allowed = [
            'audio_title',
            'audio_slug',
            'audio_duration',
            'audio_author_id',
            'audio_category_id',
            'audio_published_at',
            'audio_is_published'
        ];
        const updatedFields = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) updatedFields[field] = req.body[field];
        }

        // Validar y parsear duración si viene
        if (updatedFields.audio_duration !== undefined) {
            const dur = parseInt(updatedFields.audio_duration, 10);
            if (isNaN(dur) || dur < 1) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'La duración (`audio_duration`) debe ser un entero >= 1 (segundos).'
                });
            }
            updatedFields.audio_duration = dur;
        }

        // Manejar nuevo archivo de audio
        if (req.processedAudio) {
            // Eliminar el audio anterior si existe
            const oldUrl = audio.audio_url;
            if (oldUrl && !oldUrl.includes('default')) {
                await deleteFromBunny(oldUrl).catch(e => console.error('Delete audio error', e));
            }
            const newUrl = await uploadToBunny(
                req.processedAudio.buffer,
                'audio-files/',
                req.processedAudio.filename
            );
            updatedFields.audio_url = newUrl;
        }

        // Aplicar cambios
        await audio.update(updatedFields, { transaction: t });

        // Log de actualización
        if (req.user && Number.isInteger(req.user.id)) {
            await AudioLog.create({
                user_id: req.user.id,
                audio_id: id,
                action: 'update',
                details: JSON.stringify({ fields: Object.keys(updatedFields) }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();

        // Invalidar caché
        try {
            await clearByPattern(`audio:${id}`);
            await clearByPattern('audios:*');
            await clearByPattern('categories:all');
        } catch (cacheErr) {
            console.error('Redis cleanup error', cacheErr);
        }

        return res.status(200).json({ status: 'success', message: 'Nota de audio actualizada.', audio });
    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error('[Audios][Update]', err);
        return res.status(500).json({ status: 'error', message: 'Error al actualizar nota de audio.' });
    }
};
*/