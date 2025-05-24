// controllers/articles/getArticleById.js
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID inválido.',
            });
        }

        const cacheKey = `article:${id}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const article = await Article.findByPk(id, {
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
            });

            if (!article) {
                return null;
            }

            return {
                status: 'success',
                article,
            };
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('[Articles][GetById]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el artículo.',
        });
    }
};
