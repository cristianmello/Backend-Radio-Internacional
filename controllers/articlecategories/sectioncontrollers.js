// src/controllers/sectionsController.js
const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const Section = require('../../models/sectionarticles');
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const sectionSlug = req.params.sectionSlug || 'maincontent';
        const categorySlug = req.query.category;

        const cacheKey = `section-articles:${sectionSlug}:category:${categorySlug || 'all'}`;

        const articles = await getOrSetCache(cacheKey, async () => {

            const categoryWhere = categorySlug
                ? { category_slug: categorySlug }
                : {};

            return Article.findAll({
                where: { article_is_published: true },
                include: [
                    {
                        model: Section,
                        as: 'sections',
                        where: { section_slug: sectionSlug },
                        through: { attributes: [] }
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        where: categoryWhere,
                        attributes: ['category_slug', 'category_name']
                    }
                ],
                order: [['article_published_at', 'DESC']]
            });
        }, 300); 

        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');

        return res.status(200).json({ data: articles });

    } catch (err) {
        console.error('Error fetching section articles:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
