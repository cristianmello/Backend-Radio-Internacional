// controllers/articles/getAllArticles.js
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const category = req.query.category_id || '';
        const published = req.query.published || '';

        const cacheKey = `articles:page=${page}&limit=${limit}&category=${category}&published=${published}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const where = {};
            if (category) where.article_category_id = category;
            if (published) where.article_is_published = published === 'true';

            const { rows: articles, count } = await Article.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname'],
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        attributes: ['category_code', 'category_name'],
                    },
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
                articles,
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error('[Articles][GetAll]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los artículos.',
        });
    }
};
