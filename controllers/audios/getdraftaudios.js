// src/controllers/audios/getDraftAudios.js
const { getOrSetCache } = require('../../services/cacheservice');
const Audio = require('../../models/audios');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * limit;

        const cacheKey = `draftsaudios:page=${page}&limit=${limit}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // Sólo drafts (no publicados)
            const where = { audio_is_published: false };

            const includes = [
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
            ];

            const { rows: audios, count } = await Audio.findAndCountAll({
                where,
                include: includes,
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                status: 'success',
                page,
                pageSize: limit,
                total: count,
                items: audios.map(a => {
                    const minutes = Math.floor(a.audio_duration / 60);
                    const seconds = String(a.audio_duration % 60).padStart(2, '0');
                    return {
                        audio_code: a.audio_code,
                        title: a.audio_title,
                        url: a.audio_url,
                        duration: `${minutes}:${seconds}`,
                        category: a.category.category_name,
                        author: `${a.author.user_name} ${a.author.user_lastname}`,
                        published_at: a.audio_published_at,
                        link: `/audio/${a.category.category_slug}/${a.audio_slug}`,
                    };
                }),
            };
        });

        res.set('Cache-Control', 'no-store');

        return res.status(200).json(data);
    } catch (error) {
        console.error('[Audios][GetDrafts]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener los borradores de audio.',
        });
    }
};
