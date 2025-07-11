const { getOrSetCache } = require('../../services/cacheservice');
const Short = require('../../models/short');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        // Paginación opcional
        const limit = parseInt(req.query.limit, 10) || 10;
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * limit;

        const cacheKey = `shorts:drafts:page=${page}&limit=${limit}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // solo los shorts no publicados
            const where = { short_is_published: false };

            // incluye autor y categoría
            const { rows: shorts, count } = await Short.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname']
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        attributes: ['category_code', 'category_name']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            return {
                status: 'success',
                page,
                pageSize: limit,
                total: count,
                items: shorts.map(s => ({
                    short_code: s.short_code,
                    title: s.short_title,
                    thumbnail: s.short_video_url,    // o una URL si tienes thumbnail distinto
                    duration: `${s.short_duration}s`,
                    views: s.short_views || 0,   // si tienes conteo de vistas
                    author: `${s.author.user_name} ${s.author.user_lastname}`,
                    category: s.category.category_name,
                    date: s.short_published_at,
                    url: `/shorts/${s.short_slug}`,
                }))
            };
        });

        return res.status(200).json(data);
    } catch (err) {
        console.error('[Shorts][GetDrafts]', err);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener borradores de shorts.'
        });
    }
};
