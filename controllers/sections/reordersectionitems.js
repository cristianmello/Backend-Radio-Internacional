// src/controllers/sections/reorderSectionItems.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionLog = require('../../models/sectionlog');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    // 0. Inicia transacción
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;
        const { orderedCodes } = req.body; // array de article_code, short_code o audio_code

        // 1. Validar payload
        if (!Array.isArray(orderedCodes)) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Debe enviar orderedCodes como array.'
            });
        }

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

        // 3. Detectar tipo de pivot y campo clave
        let ModelMap, keyField;
        if (section.section_type === 'shorts') {
            ModelMap = SectionShortMap;
            keyField = 'short_code';
        } else if (section.section_type === 'sideaudios') {
            ModelMap = SectionAudioMap;
            keyField = 'audio_code';
        } else {
            ModelMap = SectionArticleMap;
            keyField = 'article_code';
        }

        // 4. Actualizar posiciones en el pivot
        await Promise.all(
            orderedCodes.map((code, idx) =>
                ModelMap.update(
                    { position: idx },
                    {
                        where: {
                            section_code: section.section_code,
                            [keyField]: code
                        },
                        transaction: t
                    }
                )
            )
        );

        // 5. Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'reorder_items',
                details: JSON.stringify({ orderedCodes }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 6. Commit
        await t.commit();

        // 7. Invalida caché de la sección
        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (cacheErr) {
            console.warn(`Error limpiando caché sections:${slug}:items`, cacheErr);
        }

        // 8. Respuesta
        return res.status(200).json({
            status: 'success',
            message: 'Ítems reordenados correctamente.'
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][ReorderItems]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al reordenar los ítems de la sección.'
        });
    }
};

/*// src/controllers/sections/reorderSectionItems.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionLog = require('../../models/sectionlog');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    // 0. Inicia transacción
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;
        const { orderedCodes } = req.body; // array de article_code o short_code

        // 1. Validar payload
        if (!Array.isArray(orderedCodes)) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Debe enviar orderedCodes como array.'
            });
        }

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

        // 3. Actualizar posiciones en el pivot
        const ModelMap = section.section_type === 'shorts'
            ? SectionShortMap
            : SectionArticleMap;
        const keyField = section.section_type === 'shorts'
            ? 'short_code'
            : 'article_code';

        await Promise.all(
            orderedCodes.map((code, idx) =>
                ModelMap.update(
                    { position: idx },
                    {
                        where: {
                            section_code: section.section_code,
                            [keyField]: code
                        },
                        transaction: t
                    }
                )
            )
        );

        // 4. Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'reorder_items',
                details: JSON.stringify({ orderedCodes }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 5. Commit
        await t.commit();

        // 6. Invalida caché (no crítico)
        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (cacheErr) {
            console.warn(`Error limpiando caché sections:${slug}:items`, cacheErr);
        }

        // 7. Respuesta
        return res.status(200).json({
            status: 'success',
            message: 'Ítems reordenados correctamente.'
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][ReorderItems]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al reordenar los ítems de la sección.'
        });
    }
};
*/