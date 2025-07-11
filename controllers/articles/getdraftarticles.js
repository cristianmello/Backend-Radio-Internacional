// src/controllers/articles/getDraftArticles.js
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        // Podemos parametrizar page/limit igual que en GetArticles, o hardcodearlos:
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const cacheKey = `drafts:page=${page}&limit=${limit}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // Buscamos únicamente los no publicados
            const where = { article_is_published: false };

            const includes = [
                {
                    model: User,
                    as: "author",
                    attributes: ["user_code", "user_name", "user_lastname"],
                },
                {
                    model: ArticleCategory,
                    as: "category",
                    attributes: ["category_code", "category_name", "category_slug"],
                },
            ];

            const { rows: articles, count } = await Article.findAndCountAll({
                where,
                attributes: [
                    'article_code',
                    'article_slug',
                    'article_title',
                    'article_excerpt',
                    'article_image_url',
                    'article_published_at',
                    'article_content',
                    'article_is_premium'
                ],
                include: includes,
                order: [["created_at", "DESC"]],
                limit,
                offset,
            });

            return {
                status: "success",
                page,
                pageSize: limit,
                total: count,
                items: articles.map(a => ({
                    article_code: a.article_code,
                    article_slug: a.article_slug,
                    title: a.article_title,
                    excerpt: a.article_excerpt,
                    image: a.article_image_url,
                    category: a.category.category_name,
                    author: `${a.author.user_name} ${a.author.user_lastname}`,
                    date: a.article_published_at,
                    readTime: `${Math.ceil(a.article_content.split(" ").length / 200)} min lectura`,
                    url: `/categoria/${a.category.category_slug}/${a.article_slug}`,
                    is_premium: a.article_is_premium,
                })),
            };
        });

        res.set('Cache-Control', 'no-store');

        return res.status(200).json(data);
    } catch (error) {
        console.error("[Articles][GetDrafts]", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los borradores.",
        });
    }
};
