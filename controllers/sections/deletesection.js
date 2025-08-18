const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');
const SectionLog = require('../../models/sectionlog');
const Article = require('../../models/article');
const Short = require('../../models/short');
const Audio = require('../../models/audios');
const Advertisement = require('../../models/advertisement');
const redisClient = require('../../services/redisclient');
const { Op } = require('sequelize');

// Helper para limpiar caché de forma segura
async function clearCacheByPattern(pattern) {
    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            if (keys.length) {
                await redisClient.del(...keys);
            }
            cursor = nextCursor;
        } while (cursor !== '0');
    } catch (e) {
        console.warn(`[Cache] Error limpiando el patrón "${pattern}":`, e);
    }
}

module.exports = async (req, res) => {
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;

        // 1) Buscar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        // 2) Proteger secciones marcadas
        if (section.is_protected) {
            await t.rollback();
            return res.status(403).json({ status: 'error', message: 'Esta sección no puede eliminarse.' });
        }

        // 3) Log de auditoría opcional
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'delete',
                details: JSON.stringify({ slug: section.section_slug, title: section.section_title }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 4) Obtener pivotes de TODOS los tipos de contenido
        const articlePivots = await SectionArticleMap.findAll({ where: { section_code: section.section_code }, transaction: t });
        const shortPivots = await SectionShortMap.findAll({ where: { section_code: section.section_code }, transaction: t });
        const audioPivots = await SectionAudioMap.findAll({ where: { section_code: section.section_code }, transaction: t });
        const adPivots = await SectionAdvertisementMap.findAll({ where: { section_code: section.section_code }, transaction: t });

        // 5) Desactivar/Despublicar items asociados
        for (const pivot of articlePivots) {
            // Contamos en cuántas OTRAS secciones aparece este artículo
            const otherAppearances = await SectionArticleMap.count({
                where: {
                    article_code: pivot.article_code,
                    section_code: { [Op.ne]: section.section_code } // [Op.ne] significa "No es Igual"
                },
                transaction: t
            });

            // Si no aparece en ninguna otra sección, lo despublicamos.
            if (otherAppearances === 0) {
                await Article.update({ article_is_published: false }, { where: { article_code: pivot.article_code }, transaction: t });
            }
        }

        for (const pivot of shortPivots) {
            const otherAppearances = await SectionShortMap.count({
                where: {
                    short_code: pivot.short_code,
                    section_code: { [Op.ne]: section.section_code }
                },
                transaction: t
            });
            if (otherAppearances === 0) {
                await Short.update({ short_is_published: false }, { where: { short_code: pivot.short_code }, transaction: t });
            }
        }

        for (const pivot of audioPivots) {
            const otherAppearances = await SectionAudioMap.count({
                where: {
                    audio_code: pivot.audio_code,
                    section_code: { [Op.ne]: section.section_code }
                },
                transaction: t
            });
            if (otherAppearances === 0) {
                await Audio.update({ audio_is_published: false }, { where: { audio_code: pivot.audio_code }, transaction: t });
            }
        }

        // Para los anuncios, mantenemos la lógica de simplemente desactivarlos
        for (const { ad_id } of adPivots) {
            await Advertisement.update({ ad_is_active: false }, { where: { ad_id }, transaction: t });
        }

        // 6) Eliminar pivotes de sección
        await SectionArticleMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionShortMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionAudioMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionAdvertisementMap.destroy({ where: { section_code: section.section_code }, transaction: t }); // <-- 5. AÑADIDO

        // 7) Eliminar la propia sección
        await section.destroy({ transaction: t });

        // 8) Commit
        await t.commit();

        // 9) Invalidar caché de forma exhaustiva (Post-Commit)
        // Usamos una función helper para que el código sea más limpio y seguro.
        await Promise.all([
            clearCacheByPattern('sections:*'),
            clearCacheByPattern('pages:*'),
            clearCacheByPattern('drafts:*'),
            clearCacheByPattern('shorts:drafts:*'),
            clearCacheByPattern('audios:*'),
            clearCacheByPattern('advertisements:*')
        ]);

        // 10) Responder
        return res.status(200).json({ status: 'success', message: 'Sección eliminada correctamente.' });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][Delete]', error);
        return res.status(500).json({ status: 'error', message: 'Error al eliminar la sección.' });
    }
};
/*// src/controllers/sections/deleteSection.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionLog = require('../../models/sectionlog');
const Article = require('../../models/article');
const Short = require('../../models/short');
const Audio = require('../../models/audios');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;

        // 1) Buscar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        // 2) Proteger secciones marcadas
        if (section.is_protected) {
            await t.rollback();
            return res.status(403).json({ status: 'error', message: 'Esta sección no puede eliminarse.' });
        }

        // 3) Log de auditoría opcional
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'delete',
                details: JSON.stringify({ slug: section.section_slug, title: section.section_title }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 4) Obtener pivotes de artículos, shorts y audios
        const articlePivots = await SectionArticleMap.findAll({
            where: { section_code: section.section_code },
            transaction: t
        });
        const shortPivots = await SectionShortMap.findAll({
            where: { section_code: section.section_code },
            transaction: t
        });
        const audioPivots = await SectionAudioMap.findAll({
            where: { section_code: section.section_code },
            transaction: t
        });

        // 5) Actualizar published = false en artículos, shorts y audios
        for (const { article_code } of articlePivots) {
            await Article.update(
                { article_is_published: false },
                { where: { article_code }, transaction: t }
            );
        }
        for (const { short_code } of shortPivots) {
            await Short.update(
                { short_is_published: false },
                { where: { short_code }, transaction: t }
            );
        }
        for (const { audio_code } of audioPivots) {
            await Audio.update(
                { audio_is_published: false },
                { where: { audio_code }, transaction: t }
            );
        }

        // 6) Eliminar pivotes de sección (artículos, shorts y audios)
        await SectionArticleMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionShortMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionAudioMap.destroy({ where: { section_code: section.section_code }, transaction: t });

        // 7) Eliminar la propia sección
        await SectionArticles.destroy({ where: { section_code: section.section_code }, transaction: t });

        // 8) Commit
        await t.commit();

        // 9) Invalidar caché de secciones, drafts y audios
        try {
            const sectionKeys = await redisClient.keys('sections:*');
            const draftKeys = await redisClient.keys('drafts:*');
            const shortDraftKeys = await redisClient.keys('shorts:drafts:*');
            const audioKeys = await redisClient.keys('audios:*');

            const allKeys = [...sectionKeys, ...draftKeys, ...shortDraftKeys, ...audioKeys];
            if (allKeys.length) await Promise.all(allKeys.map(key => redisClient.del(key)));
        } catch (e) {
            console.warn('Error invalidando caché después de eliminar sección:', e);
        }

        // 10) Responder
        return res.status(200).json({ status: 'success', message: 'Sección eliminada correctamente.' });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][Delete]', error);
        return res.status(500).json({ status: 'error', message: 'Error al eliminar la sección.' });
    }
};
*/


/*const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionLog = require('../../models/sectionlog');
const Article = require('../../models/article');
const Short = require('../../models/short');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;

        // 1) Buscar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        // 2) Proteger secciones marcadas
        if (section.is_protected) {
            await t.rollback();
            return res.status(403).json({ status: 'error', message: 'Esta sección no puede eliminarse.' });
        }

        // 3) Log de auditoría opcional
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'delete',
                details: JSON.stringify({ slug: section.section_slug, title: section.section_title }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 4) Obtener pivotes de artículos y shorts
        const articlePivots = await SectionArticleMap.findAll({
            where: { section_code: section.section_code },
            transaction: t
        });
        const shortPivots = await SectionShortMap.findAll({
            where: { section_code: section.section_code },
            transaction: t
        });

        // 5) Actualizar article_is_published = false en artículos
        for (const pivot of articlePivots) {
            const { article_code } = pivot;
            await Article.update(
                { article_is_published: false },
                { where: { article_code }, transaction: t }
            );
        }

        // 6) Actualizar short_is_published = false en shorts
        for (const pivot of shortPivots) {
            const { short_code } = pivot;
            await Short.update(
                { short_is_published: false },
                { where: { short_code }, transaction: t }
            );
        }

        // 7) Eliminar pivotes de sección (ambos)
        await SectionArticleMap.destroy({ where: { section_code: section.section_code }, transaction: t });
        await SectionShortMap.destroy({ where: { section_code: section.section_code }, transaction: t });

        // 8) Eliminar la propia sección
        await SectionArticles.destroy({ where: { section_code: section.section_code }, transaction: t });


        // 9) Commit
        await t.commit();

        // 10) Invalidar caché de secciones
        const sectionKeys = await redisClient.keys('sections:*');
        if (sectionKeys.length) await Promise.all(sectionKeys.map(key => redisClient.del(key)));

        // 11) Invalidar caché de borradores de artículos
        const draftKeys = await redisClient.keys('drafts:*');
        if (draftKeys.length) await Promise.all(draftKeys.map(key => redisClient.del(key)));

        // 12) Invalidar caché de borradores de shorts
        const shortDraftKeys = await redisClient.keys('shorts:drafts:*');
        if (shortDraftKeys.length) await Promise.all(shortDraftKeys.map(key => redisClient.del(key)));

        // 13) Responder
        return res.status(200).json({ status: 'success', message: 'Sección eliminada correctamente.' });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][Delete]', error);
        return res.status(500).json({ status: 'error', message: 'Error al eliminar la sección.' });
    }
};
*/