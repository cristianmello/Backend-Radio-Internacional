// En: src/controllers/sections.js
const SectionArticles = require('../../models/sectionarticles');
const redisClient = require('../../services/redisclient');
const { clearByPattern } = require('../../services/cacheservice');

module.exports = async (req, res) => {

    const { slug } = req.params;
    const { section_title, background_color } = req.body;

    const fieldsToUpdate = {};
    if (section_title) {
        fieldsToUpdate.section_title = section_title;
    }
    if (background_color) {
        fieldsToUpdate.background_color = background_color;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ msg: 'No se proporcionaron campos para actualizar.' });
    }

    try {
        const section = await SectionArticles.findOne({ where: { section_slug: slug } });

        if (!section) {
            return res.status(404).json({ msg: 'Sección no encontrada.' });
        }

        await section.update(fieldsToUpdate);

        if (redisClient) {
            await clearByPattern(`sections:${slug}`);
            await clearByPattern('sections:*');
            await clearByPattern('sections:all');
            await clearByPattern('pages:*');
        }

        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (e) {
            console.warn(`Error limpiando caché sections:${slug}:items`, e);
        }

        res.status(200).json({
            msg: 'Sección actualizada correctamente.',
            section
        });

    } catch (error) {
        console.error('[Sections][Update]', error);
        res.status(500).json({ msg: 'Error interno del servidor al actualizar la sección.' });
    }
};

