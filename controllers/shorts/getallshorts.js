// controllers/shorts/getAllShorts.js
const { getOrSetCache } = require('../../services/cacheservice');
const Short = require('../../models/short');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory'); // agregado

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const published = req.query.published || '';

        const cacheKey = `shorts:page=${page}&limit=${limit}&published=${published}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const where = {};
            if (published) where.short_is_published = published === 'true';

            const { rows: shorts, count } = await Short.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname'],
                    },
                    {
                        model: ArticleCategory,
                        as: 'category', // el alias que tengas configurado
                        attributes: ['category_code', 'category_name'],
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                status: 'success',
                page,
                pageSize: limit,
                total: count,
                shorts,
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error('[Shorts][GetAll]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los shorts.',
        });
    }
};
