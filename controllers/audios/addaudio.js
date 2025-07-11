// src/controllers/audios/addAudio.js

const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const { uploadToBunny } = require('../../services/bunnystorage');
const AudioLog = require('../../models/audio_log');
const Audio = require('../../models/audios');

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
    try {
        const {
            audio_title,
            audio_slug,
            audio_author_id,
            audio_category_id,
            audio_published_at
        } = req.body;

        // 1) Validar autor
        const author = await User.findByPk(audio_author_id, { transaction: t });
        if (!author) {
            throw { status: 404, message: 'El autor especificado no existe.' };
        }

        // 2) Validar categoría
        const category = await ArticleCategory.findByPk(audio_category_id, { transaction: t });
        if (!category) {
            throw { status: 404, message: 'La categoría especificada no existe.' };
        }

        // 3) Validar que venga archivo procesado
        if (!req.processedAudio) {
            throw { status: 400, message: 'Debe enviar un archivo de audio válido.' };
        }

        const { buffer, filename, duration } = req.processedAudio;
        if (duration == null || duration < 1) {
            throw { status: 400, message: 'No se pudo determinar la duración del audio.' };
        }

        // 4) Subir el buffer a Bunny
        const audio_url = await uploadToBunny(buffer, 'article-audios/', filename);

        // 5) Crear la nota de audio con is_published = false
        const newAudio = await Audio.create({
            audio_title,
            audio_slug,
            audio_duration: duration,
            audio_url,
            audio_author_id,
            audio_category_id,
            audio_published_at: audio_published_at || new Date(),
            audio_is_published: false
        }, { transaction: t });

        // 6) Registrar auditoría
        if (req.user && req.user.id) {
            await AudioLog.create({
                user_id: req.user.id,
                audio_id: newAudio.audio_code,
                action: 'create',
                details: JSON.stringify({
                    title: newAudio.audio_title,
                    slug: newAudio.audio_slug,
                    url: newAudio.audio_url,
                    duration: newAudio.audio_duration
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 7) Commit y limpiar caché
        await t.commit();
        await clearByPattern('audios:*');
        await clearByPattern('categories:all');
        await clearByPattern('draftsaudios:*');
        // 8) Responder
        return res.status(201).json({
            status: 'success',
            message: 'Nota de audio creada correctamente en estado borrador.',
            audio: newAudio
        });

    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error('[Audios][Create]', err);
        if (err.status) {
            return res.status(err.status).json({ status: 'error', message: err.message });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Error al crear la nota de audio.'
        });
    }
};
