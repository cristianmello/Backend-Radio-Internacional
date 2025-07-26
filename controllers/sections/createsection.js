// src/controllers/sections/createSection.js
const slugify = require('slugify');
const SectionArticles = require('../../models/sectionarticles');
const SectionLog = require('../../models/sectionlog');
const redisClient = require('../../services/redisclient');

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
        const { section_title, section_type, is_protected = false } = req.body;

        // 1. Validaciones básicas
        if (!section_type) {
            await t.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Debe especificarse el tipo de sección (section_type).'
            });
        }


        // 2. Generar slug base
        let baseSlug = section_title
            ? slugify(section_title, { lower: true, strict: true })
            : `${section_type}-${Date.now()}`;
        if (!baseSlug) {
            baseSlug = `${section_type}-${Date.now()}`;
        }

        // 3. Asegurar unicidad de slug
        let slug = baseSlug;
        let counter = 1;
        /* eslint-disable no-await-in-loop */
        while (await SectionArticles.findOne({ where: { section_slug: slug }, transaction: t })) {
            slug = `${baseSlug}-${counter++}`;
        }
        /* eslint-enable no-await-in-loop */

        // 4. Calcular posición (al final)
        const maxPos = (await SectionArticles.max('section_position', { transaction: t })) || 0;
        const position = maxPos + 1;

        // 5. Crear sección
        const newSection = await SectionArticles.create({
            section_title,
            section_type,
            section_slug: slug,
            section_position: position,
            is_protected,

        }, { transaction: t });

        // 6. (Opcional) Registrar log de creación
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: newSection.section_code,
                action: 'create',
                details: JSON.stringify({ title: section_title, type: section_type }),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 7. Commit y limpieza de cachFvé
        await t.commit();

        await Promise.all([
            clearCacheByPattern('sections:*'),
            clearCacheByPattern('pages:*'),
            clearCacheByPattern('drafts:*'),
            clearCacheByPattern('shorts:drafts:*'),
            clearCacheByPattern('audios:*'),
            clearCacheByPattern('advertisements:*')
        ]);

        // 8. Respuesta
        res.status(201).json({
            status: 'success',
            message: 'Sección creada correctamente.',
            section: newSection
        });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][Create]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la sección.'
        });
    }
};
