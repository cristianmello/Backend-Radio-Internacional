// src/controllers/sections/getSections.js
const SectionArticles = require('../../models/sectionarticles');
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const cacheKey = 'sections:all';

        const data = await getOrSetCache(cacheKey, async () => {
            const sections = await SectionArticles.findAll({
                order: [['section_position', 'ASC']],
                attributes: [
                    'section_code',
                    'section_slug',
                    'section_title',
                    'section_type',
                    'section_position',
                    'section_limit',
                    'is_protected'
                ]
            });
            return { status: 'success', sections };
        });

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

        res.status(200).json(data);
    } catch (error) {
        console.error('[Sections][GetAll]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las secciones.'
        });
    }
};
