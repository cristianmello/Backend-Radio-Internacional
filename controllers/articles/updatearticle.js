const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const uploadImageToBunny = require('../../utils/uploadImageToBunny');
const deleteImageFromBunny = require('../../utils/deleteImageFromBunny');
const fs = require('fs');
const path = require('path');

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

        let updatedFields = {
            article_title,
            article_slug,
            article_content,
            article_author_id,
            article_category_id,
            article_published_at,
            article_is_published,
            article_is_premium
        };

        // Manejo de nueva imagen
        if (req.file) {
            const oldImagePath = article.article_image_url;

            // Borrar imagen anterior si no es la default
            if (oldImagePath && !oldImagePath.includes('default.webp')) {
                await deleteImageFromBunny(oldImagePath);
            }

            const localPath = path.join(__dirname, '../../', req.file.path);
            const uploadedImageUrl = await uploadImageToBunny(localPath);
            fs.unlinkSync(localPath); // borrar archivo local
            updatedFields.article_image_url = uploadedImageUrl;
        }

        await article.update(updatedFields, { transaction: t });

        await t.commit();

        await redisClient.del(`article:${id}`);
        await redisClient.keys('articles:*').then(keys => keys.forEach(k => redisClient.del(k)));

        res.status(200).json({
            status: 'success',
            message: 'Artículo actualizado correctamente.',
            article
        });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Articles][Update]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el artículo.',
        });
    }
};
