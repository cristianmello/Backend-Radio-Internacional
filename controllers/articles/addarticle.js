const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const { uploadToBunny } = require('../../services/bunnystorage');
const ArticleLog = require('../../models/articlelog');

async function clearByPattern(pattern) {
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) await redisClient.del(...keys);
        cursor = nextCursor;
    } while (cursor !== '0');
}


module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    try {
        const {
            article_title,
            article_slug,
            article_excerpt,
            article_content,
            article_author_id,
            article_category_id,
            article_is_published,
            article_is_premium
        } = req.body;

        const file = req.file;

        // Validar que el autor exista
        const authorExists = await User.findByPk(article_author_id);
        if (!authorExists) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'El autor especificado no existe.',
            });
        }

        // Validar que la categoría exista
        const categoryExists = await ArticleCategory.findByPk(article_category_id);
        if (!categoryExists) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'La categoría especificada no existe.',
            });
        }

        // Manejar imagen enviada
        let article_image_url = null;
        if (req.processedImage) {
            article_image_url = await uploadToBunny(
                req.processedImage.buffer,
                'article-images/',
                req.processedImage.filename
            );
        }

        const publishedAt = article_is_published ? new Date() : null;

        const newArticle = await Article.create({
            article_title,
            article_slug,
            article_excerpt,
            article_content,
            article_image_url,
            article_author_id,
            article_category_id,
            article_published_at: publishedAt,
            article_is_published,
            article_is_premium
        }, { transaction: t });

        if (req.user) {
            await ArticleLog.create({
                user_id: req.user.id,
                article_id: newArticle.article_code,
                action: 'create',
                details: JSON.stringify({
                    title: newArticle.article_title,
                    slug: newArticle.article_slug
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();

        await clearByPattern('articles:*');
        await clearByPattern('drafts:*');
        await clearByPattern('categories:all');

        res.status(201).json({
            status: 'success',
            message: 'Artículo creado correctamente.',
            article: newArticle
        });
    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error('[Articles][Create]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear el artículo.',
        });
    }

};
