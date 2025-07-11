// src/controllers/audios/getAudioById.js
const { getOrSetCache } = require('../../services/cacheservice');
const Audio = require('../../models/audios');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea numérico
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID inválido.',
            });
        }

        const cacheKey = `audio:${id}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const audio = await Audio.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname'],
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        attributes: ['category_code', 'category_name', 'category_slug'],
                    },
                ],
            });

            if (!audio) {
                return null;
            }

            // Formatear duración a mm:ss
            const minutes = Math.floor(audio.audio_duration / 60);
            const seconds = String(audio.audio_duration % 60).padStart(2, '0');

            return {
                status: 'success',
                audio: {
                    audio_code: audio.audio_code,
                    title: audio.audio_title,
                    slug: audio.audio_slug,
                    url: audio.audio_url,
                    duration: `${minutes}:${seconds}`,
                    category: {
                        code: audio.category.category_code,
                        name: audio.category.category_name,
                        slug: audio.category.category_slug,
                    },
                    author: {
                        code: audio.author.user_code,
                        name: `${audio.author.user_name} ${audio.author.user_lastname}`,
                    },
                    published_at: audio.audio_published_at,
                    is_published: audio.audio_is_published,
                    created_at: audio.created_at,
                    updated_at: audio.updated_at,
                },
            };
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Nota de audio no encontrada.',
            });
        }
        res.set('Cache-Control', 'public, max-age=300, s-maxage=900');

        return res.status(200).json(data);
    } catch (error) {
        console.error('[Audios][GetById]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener la nota de audio.',
        });
    }
};
