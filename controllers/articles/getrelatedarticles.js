// controllers/articles/getRelatedArticles.js

const { Op } = require('sequelize');
const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        // 1. Obtenemos el ID del artículo actual de los parámetros de la URL
        const currentArticleId = req.params.id;

        // Validamos que el ID sea un número
        if (!/^\d+$/.test(currentArticleId)) {
            return res.status(400).json({ message: 'ID de artículo inválido.' });
        }

        const cacheKey = `related-articles:${currentArticleId}`;

        const relatedArticles = await getOrSetCache(cacheKey, async () => {
            // 2. Buscamos el artículo actual para obtener su ID de categoría
            const currentArticle = await Article.findByPk(currentArticleId, {
                attributes: ['article_category_id']
            });

            // Si el artículo principal no existe, no podemos encontrar relacionados
            if (!currentArticle) {
                return []; // Devolvemos un array vacío
            }

            const categoryId = currentArticle.article_category_id;

            // 3. Buscamos otros 4 artículos con la misma categoría
            const articles = await Article.findAll({
                where: {
                    [Op.and]: [
                        { article_category_id: categoryId },
                        { article_is_published: true },
                        { article_code: { [Op.ne]: currentArticleId } }
                    ]
                },
                limit: 4, // Limitamos el resultado a 4 artículos
                order: [
                    ['article_published_at', 'DESC'] // Ordenamos por fecha de publicación más reciente
                ],
                include: [{
                    model: ArticleCategory,
                    as: 'category',
                    attributes: ['category_name'] // Incluimos el nombre de la categoría para verificar
                }]
            });

            // 4. Mapeamos el resultado a un formato limpio
            return articles.map(a => ({
                article_code: a.article_code,
                article_slug: a.article_slug,
                title: a.article_title,
                image: a.article_image_url,
                date: a.article_published_at,
                excerpt: a.article_excerpt,
                category: a.category?.category_name || 'Sin Categoría'
            }));
        });

        if (!relatedArticles) {
            return res.status(404).json({ message: 'No se encontraron artículos relacionados.' });
        }

        return res.status(200).json({
            status: 'success',
            items: relatedArticles
        });

    } catch (error) {
        console.error('[Articles][GetRelated]', error);
        return res.status(500).json({ message: 'Error al obtener los artículos relacionados.' });
    }
};