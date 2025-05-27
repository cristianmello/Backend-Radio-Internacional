const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    try {
        const { id } = req.params;

        const article = await Article.findByPk(id);
        if (!article) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        const {
            article_title,
            article_slug,
            article_content,
            article_image_url,
            article_author_id,
            article_category_id,
            article_published_at,
            article_is_published,
            article_is_premium
        } = req.body;

        // Validar autor si cambia
        if (article_author_id && article_author_id !== article.article_author_id) {
            const authorExists = await User.findByPk(article_author_id);
            if (!authorExists) {
                await t.rollback();
                return res.status(404).json({
                    status: 'error',
                    message: 'El nuevo autor especificado no existe.',
                });
            }
        }

        // Validar categoría si cambia
        if (article_category_id && article_category_id !== article.article_category_id) {
            const categoryExists = await ArticleCategory.findByPk(article_category_id);
            if (!categoryExists) {
                await t.rollback();
                return res.status(404).json({
                    status: 'error',
                    message: 'La nueva categoría especificada no existe.',
                });
            }
        }

        await article.update({
            article_title,
            article_slug,
            article_content,
            article_image_url,
            article_author_id,
            article_category_id,
            article_published_at,
            article_is_published,
            article_is_premium
        }, { transaction: t });

        await t.commit();

        await redisClient.del(`article:${id}`);
        await redisClient.keys('articles:*').then(keys => keys.forEach(k => redisClient.del(k)));

        res.status(200).json({
            status: 'success',
            message: 'Artículo actualizado correctamente.',
            article
        });
    } catch (error) {
        await t.rollback();
        console.error('[Articles][Update]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el artículo.',
        });
    }
};
