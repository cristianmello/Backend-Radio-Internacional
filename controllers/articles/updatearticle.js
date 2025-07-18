const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const User = require('../../models/user');
const ArticleLog = require('../../models/articlelog');
const redisClient = require('../../services/redisclient');
const { uploadToBunny, deleteFromBunny } = require('../../services/bunnystorage');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid'); // Para nombres de archivo únicos
const path = require('path');

// Util: limpia claves con SCAN para no bloquear en producción
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
        const { id } = req.params;
        const article = await Article.findByPk(id);
        if (!article) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Artículo no encontrado.' });
        }

        const oldContent = article.article_content || '';
        const newContent = req.body.article_content;

        if (newContent) {
            const $old = cheerio.load(oldContent);
            const $new = cheerio.load(newContent);
            const oldImages = new Set();
            $old('img').each((i, img) => {
                const src = $old(img).attr('src');
                if (src && src.includes('bunnycdn.net')) oldImages.add(src);
            });
            const newImages = new Set();
            $new('img').each((i, img) => {
                const src = $new(img).attr('src');
                if (src && src.includes('bunnycdn.net')) newImages.add(src);
            });
            for (const oldImage of oldImages) {
                if (!newImages.has(oldImage)) {
                    console.log(`Borrando imagen huérfana de Bunny: ${oldImage}`);
                    await deleteFromBunny(oldImage).catch(e => console.error('Error al borrar imagen huérfana:', e));
                }
            }
        }
        // Extraer solo campos permitidos
        const {
            article_title,
            article_slug,
            article_excerpt,
            article_content,
            article_author_id,
            article_category_id,
            article_is_premium
        } = req.body;

        // Validar autor y categoría si cambian
        if (article_author_id && article_author_id !== article.article_author_id) {
            const authorExists = await User.findByPk(article_author_id);
            if (!authorExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Autor no existe.' });
            }
        }
        if (article_category_id && article_category_id !== article.article_category_id) {
            const categoryExists = await ArticleCategory.findByPk(article_category_id);
            if (!categoryExists) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Categoría no existe.' });
            }
        }

        // Reconstruir objeto solo con campos presentes
        const allowed = [
            'article_title', 'article_slug', 'article_excerpt', 'article_content',
            'article_author_id', 'article_category_id', 'article_is_premium'
        ];
        const updatedFields = {};
        allowed.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updatedFields[field] = req.body[field];
            }
        });

        // Manejar nueva imagen
        if (req.processedImage) {
            const oldUrl = article.article_image_url;
            if (oldUrl && !oldUrl.includes('default.webp')) {
                await deleteFromBunny(oldUrl).catch(e => console.error('Delete image error', e));
            }
            const newUrl = await uploadToBunny(
                req.processedImage.buffer,
                'article-images/',
                req.processedImage.filename
            );
            updatedFields.article_image_url = newUrl;
        }

        // Aplicar cambios en transacción
        await article.update(updatedFields, { transaction: t });

        // Registrar log de actualización
        if (req.user && Number.isInteger(req.user.user_code)) {
            await ArticleLog.create({
                user_id: req.user.id,
                article_id: id,
                action: 'update',
                details: JSON.stringify({ fields: Object.keys(updatedFields) }),
                timestamp: new Date()
            }, { transaction: t });
        }

        await t.commit();

        // Invalidar caché en Redis
        try {
            await clearByPattern(`article:${id}`);        // artículo individual
            await clearByPattern('articles:*');            // listados y paginaciones
            await clearByPattern('articles:category:*');   // listados por categoría
            await clearByPattern('articles:latest*');      // últimos
            await clearByPattern('categories:all');        // listado de categorías
            await clearByPattern('sections:*');            // todas las secciones cacheadas
        } catch (cacheErr) {
            console.error('Redis cleanup error', cacheErr);
        }

        return res.status(200).json({ status: 'success', message: 'Artículo actualizado.', article });
    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error('Update error', err);
        return res.status(500).json({ status: 'error', message: 'Error al actualizar artículo.' });
    }
};
