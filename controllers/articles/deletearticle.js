// src/controllers/articles/deleteArticle.js
const Article = require('../../models/article');
const ArticleLog = require('../../models/articlelog');
const redisClient = require('../../services/redisclient');
const { deleteFromBunny } = require('../../services/bunnystorage');
const cheerio = require('cheerio');

/**
 * Borra todas las claves que casen con un patrón usando SCAN + DEL en bloques.
 */
async function clearByPattern(pattern) {
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) {
            await redisClient.del(...keys);
        }
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    let transactionFinished = false;

    try {
        const { id } = req.params;

        // 1) Cargamos el artículo
        const article = await Article.findByPk(id, { transaction: t });
        if (!article) {
            await t.rollback();
            transactionFinished = true;
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        // 2) Creamos el log antes de la eliminación
        if (req.user) {
            await ArticleLog.create({
                user_id: req.user.id,
                article_id: article.article_code,
                action: 'delete',
                details: JSON.stringify({
                    title: article.article_title,
                    slug: article.article_slug
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 2.5) Borrar imágenes embebidas en el contenido
        if (article.article_content) {
            const $ = cheerio.load(article.article_content);
            const imgSrcs = [];
            $('img').each((i, img) => {
                const src = $(img).attr('src');
                if (src && src.includes('bunnycdn.net')) {
                    imgSrcs.push(src);
                }
            });
            for (const src of imgSrcs) {
                try {
                    await deleteFromBunny(src);
                } catch (err) {
                    console.error('[Bunny][DeleteEmbeddedImage]', err, src);
                }
            }
        }

        // 3) Borramos la imagen en Bunny si existe y no es default
        if (article.article_image_url && !article.article_image_url.includes('default')) {
            try {
                await deleteFromBunny(article.article_image_url);
            } catch (err) {
                console.error('[Bunny][DeleteImage]', err);
                // No abortamos la operación si la limpieza del CDN falla
            }
        }

        // 4) Eliminamos el artículo
        await article.destroy({ transaction: t });

        // 5) Commit de la transacción
        await t.commit();
        transactionFinished = true;

        // 6) Limpieza de caché en Redis
        try {
            await clearByPattern(`article:${id}`);
            await clearByPattern('pages:home');
            await clearByPattern('articles:*');
            await clearByPattern('drafts:*');
            await clearByPattern('sections:*');
            await clearByPattern('available_articles:*');
        } catch (cacheErr) {
            console.error('Redis cleanup error after delete:', cacheErr);
        }

        return res.status(200).json({
            status: 'success',
            message: 'Artículo eliminado correctamente.',
        });
    } catch (error) {
        if (!transactionFinished) {
            await t.rollback();
        }
        console.error('[Articles][Delete]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el artículo.',
        });
    }
};


/*// BACKEND/controllers/articles/deletearticle.js
const Article = require('../../models/article');
const ArticleLog = require('../../models/articlelog');
const redisClient = require('../../services/redisclient');


async function clearByPattern(pattern) {
    let cursor = '0';
    do {
        // SCAN cursor MATCH pattern COUNT 100
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) {
            // borramos en bloque
            await redisClient.del(...keys);
        }
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    let transactionFinished = false;

    try {
        const { id } = req.params;

        // 1) Cargamos el artículo en la transacción
        const article = await Article.findByPk(id, { transaction: t });
        if (!article) {
            await t.rollback();
            transactionFinished = true;
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        // 2) Creamos el log antes de la eliminación
        if (req.user) {
            await ArticleLog.create({
                user_id: req.user.id,
                article_id: article.article_code,
                action: 'delete',
                details: JSON.stringify({
                    title: article.article_title,
                    slug: article.article_slug
                }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 3) Eliminamos el artículo
        await article.destroy({ transaction: t });

        // 4) Confirmamos la transacción
        await t.commit();
        transactionFinished = true;

        // 5) Limpiamos caché en Redis
        // Borramos la key específica del artículo y luego todos los listados
        await clearByPattern(`article:${id}`);
        await clearByPattern('articles:*');
        await clearByPattern('drafts:*');
        await clearByPattern('categories:all');

        return res.status(200).json({
            status: 'success',
            message: 'Artículo eliminado correctamente.',
        });
    } catch (error) {
        if (!transactionFinished) {
            await t.rollback();
        }
        console.error('[Articles][Delete]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el artículo.',
        });
    }
};
*/
