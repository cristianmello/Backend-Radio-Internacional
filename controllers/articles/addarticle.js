const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const { uploadToBunny } = require('../../services/bunnystorage');

module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    try {
        const {
            article_title,
            article_slug,
            article_content,
            article_author_id,
            article_category_id,
            article_published_at,
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

        // Subir imagen si se envió
        let article_image_url = null;
        if (file) {
            const ext = file.originalname.split('.').pop();
            const filename = `article-${article_slug}-${Date.now()}.${ext}`;
            const folder = 'article-images/';
            article_image_url = await uploadToBunny(file.buffer, folder, filename);
        }

        const newArticle = await Article.create({
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
        await redisClient.keys('articles:*').then(keys => keys.forEach(k => redisClient.del(k)));

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
