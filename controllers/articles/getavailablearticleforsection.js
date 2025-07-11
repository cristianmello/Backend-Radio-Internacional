// src/controllers/articles/getavailablearticleforsection.js

const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');
const { Op, literal } = require('sequelize');

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const { section_slug } = req.query;
        const offset = (page - 1) * limit;

        // Es crucial tener el slug de la sección para esta lógica
        if (!section_slug) {
            return res.status(400).json({
                status: 'error',
                message: 'Se requiere el parámetro "section_slug".'
            });
        }

        // ✅ 3. Clave de caché única que incluye la sección
        const cacheKey = `available_articles:section=${section_slug}:page=${page}&limit=${limit}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // ✅ 4. La consulta clave: busca artículos que NO ESTÉN en la sección especificada
            const where = {
                article_code: {
                    [Op.notIn]: literal(
                        `(SELECT article_code FROM sectionarticlemap WHERE section_code = (SELECT section_code FROM sectionarticles WHERE section_slug = :section_slug))`
                    )
                }
            };

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
                include: includes,
                order: [["created_at", "DESC"]],
                limit,
                offset,
                replacements: { section_slug: section_slug }
            });

            // El mapeo de la respuesta es el mismo que ya tienes
            return {
                status: "success",
                page,
                pageSize: limit,
                total: count,
                items: articles.map(a => ({
                    article_code: a.article_code,
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
        console.error("[Articles][GetAvailableForSection]", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los artículos disponibles.",
        });
    }
};