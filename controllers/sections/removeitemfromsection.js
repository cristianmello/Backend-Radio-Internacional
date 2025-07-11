// src/controllers/sections/removeItemFromSection.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');

const SectionLog = require('../../models/sectionlog');
const Article = require('../../models/article');
const Short = require('../../models/short');
const Audio = require('../../models/audios');
const redisClient = require('../../services/redisclient');

async function clearByPattern(pattern) {
    if (!redisClient) return;
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) await redisClient.del(...keys);
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug, code } = req.params;

        // 1) Buscar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        // 2) Determinar pivot y eliminar
        const adTypes = ['ad-large', 'ad-small', 'ad-banner', 'ad-skyscraper', 'ad-biglarge', 'ad-verticalsm',];

        let destroyCount;
        if (adTypes.includes(section.section_type)) {
            destroyCount = await SectionAdvertisementMap.destroy({
                where: { section_code: section.section_code, ad_id: code },
                transaction: t
            });
        } else if (section.section_type === 'shorts') {
            destroyCount = await SectionShortMap.destroy({
                where: { section_code: section.section_code, short_code: code },
                transaction: t
            });
        } else if (section.section_type === 'sideaudios') {
            destroyCount = await SectionAudioMap.destroy({
                where: { section_code: section.section_code, audio_code: code },
                transaction: t
            });
        } else {
            destroyCount = await SectionArticleMap.destroy({
                where: { section_code: section.section_code, article_code: code },
                transaction: t
            });
        }

        if (!destroyCount) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Ítem no encontrado en la sección.'
            });
        }

        if (adTypes.includes(section.section_type)) {
            // INTENCIONALMENTE NO HACEMOS NADA.
            // Quitar un anuncio de una sección no debe cambiar su estado 'ad_is_active'.
            // Simplemente vuelve al "inventario" de anuncios disponibles.

        } else if (section.section_type === 'shorts') {
            const remaining = await SectionShortMap.count({ where: { short_code: code }, transaction: t });
            if (remaining === 0) {
                await Short.update(
                    { short_is_published: false },
                    { where: { short_code: code }, transaction: t }
                );
                await clearByPattern('shorts:drafts:*');

            }

        } else if (section.section_type === 'sideaudios') {
            const remaining = await SectionAudioMap.count({ where: { audio_code: code }, transaction: t });
            if (remaining === 0) {
                await Audio.update(
                    { audio_is_published: false },
                    { where: { audio_code: code }, transaction: t }
                );
                await clearByPattern('draftsaudios:*');
                await clearByPattern('audios:*');
            }

        } else {
            const remaining = await SectionArticleMap.count({ where: { article_code: code }, transaction: t });
            if (remaining === 0) {
                await Article.update(
                    { article_is_published: false },
                    { where: { article_code: code }, transaction: t }
                );
                await clearByPattern('drafts:*');

            }
        }

        // 4) Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'remove_item',
                details: JSON.stringify({ code }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 5) Commit
        await t.commit();

        await clearByPattern(`sections:${slug}:items`);

        await clearByPattern(`available_articles:section=${slug}:*`);

        // 7) Responder
        return res.status(200).json({
            status: 'success',
            message: 'Ítem eliminado correctamente. El estado de publicación se actualizó si ya no estaba en ninguna sección.'
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][RemoveItem]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el ítem de la sección.'
        });
    }
};



/*// src/controllers/sections/removeItemFromSection.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const Article = require('../../models/article');
const Short = require('../../models/short');
const SectionLog = require('../../models/sectionlog');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    // 1. Inicia transacción
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug, code } = req.params;

        // 2. Buscar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Sección no encontrada.'
            });
        }

        // 3. Eliminar del pivot según tipo
        const whereClause = {
            section_code: section.section_code,
            ...(section.section_type === 'shorts'
                ? { short_code: code }
                : { article_code: code })
        };
        const destroyCount = section.section_type === 'shorts'
            ? await SectionShortMap.destroy({ where: whereClause, transaction: t })
            : await SectionArticleMap.destroy({ where: whereClause, transaction: t });

        if (!destroyCount) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Ítem no encontrado en la sección.'
            });
        }

        // 4. Comprobar si queda en otras secciones y solo entonces despublicar
        if (section.section_type === 'shorts') {
            // Cuenta cuántas secciones aún incluyen este short
            const remainingShorts = await SectionShortMap.count({
                where: { short_code: code },
                transaction: t
            });
            if (remainingShorts === 0) {
                await Short.update(
                    { short_is_published: false },
                    { where: { short_code: code }, transaction: t }
                );

                const keys = await redisClient.keys('shorts:drafts:*');
                if (keys.length) {
                    await Promise.all(keys.map(k => redisClient.del(k)));
                }
            }
        } else {
            // Cuenta cuántas secciones aún incluyen este artículo
            const remainingArticles = await SectionArticleMap.count({
                where: { article_code: code },
                transaction: t
            });
            if (remainingArticles === 0) {
                await Article.update(
                    { article_is_published: false },
                    { where: { article_code: code }, transaction: t }
                );
                const keys = await redisClient.keys('drafts:*');
                if (keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            }
        }

        // 5. Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'remove_item',
                details: JSON.stringify({ code }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 6. Commit
        await t.commit();

        // 7. Invalida caché (no crítico)
        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (cacheErr) {
            console.warn(`Error limpiando caché sections:${slug}:items`, cacheErr);
        }

        // 8. Respuesta
        return res.status(200).json({
            status: 'success',
            message: 'Ítem eliminado correctamente. El estado de publicación se actualizó si ya no estaba en ninguna sección.'
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][RemoveItem]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el ítem de la sección.'
        });
    }
};
*/