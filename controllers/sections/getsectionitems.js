// --- IMPORTACIONES COMPLETAS ---
const { Op } = require('sequelize');
const SectionArticles = require('../../models/sectionarticles');
const Article = require('../../models/article');
const Short = require('../../models/short');
const Audio = require('../../models/audios');
const Advertisement = require('../../models/advertisement');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');
const { getOrSetCache } = require('../../services/cacheservice');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    try {
        const { slug } = req.params;

        // ======================= LA SOLUCIÓN DEFINITIVA =======================

        // PASO 1: VERIFICAR LA EXISTENCIA EN LA BASE DE DATOS PRIMERO
        // Esta consulta es muy rápida porque busca por un campo indexado (slug).
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            attributes: ['section_code', 'section_type'] // Solo traemos lo que necesitamos
        });

        // PASO 2: SI NO EXISTE EN LA BD, LA OPERACIÓN SE DETIENE.
        if (!section) {
            // Como medida de seguridad, borramos un posible caché huérfano que haya quedado en Redis.
            await redisClient.del(`sections:${slug}:items`);
            return res.status(404).json({
                status: 'error',
                message: 'Sección no encontrada.'
            });
        }

        // PASO 3: SOLO SI la sección existe en la BD, procedemos con la lógica de caché.
        const cacheKey = `sections:${slug}:items`;
        const data = await getOrSetCache(cacheKey, async () => {

            // La lógica aquí dentro ahora tiene la CERTEZA de que la sección es válida.
            // Usaremos el 'section_code' que ya obtuvimos para hacer las consultas más eficientes.

            const adTypes = ['ad-large', 'ad-small', 'ad-banner', 'ad-skyscraper', 'ad-biglarge', 'ad-verticalsm',];

            if (adTypes.includes(section.section_type)) {
                // Lógica para Publicidad
                const withAds = await SectionArticles.findByPk(section.section_code, {
                    include: [{
                        model: Advertisement,
                        as: 'advertisements',
                        where: {
                            // CONDICIÓN 1: Debe estar activo manualmente.
                            ad_is_active: true,

                            // CONDICIÓN 2: Y (AND) debe cumplir las condiciones de fecha.
                            [Op.and]: [
                                {
                                    // La fecha de inicio debe ser nula O menor/igual a la fecha actual.
                                    [Op.or]: [
                                        { ad_start_date: { [Op.is]: null } },
                                        { ad_start_date: { [Op.lte]: new Date() } }
                                    ]
                                },
                                {
                                    // La fecha de fin debe ser nula O mayor/igual a la fecha actual.
                                    [Op.or]: [
                                        { ad_end_date: { [Op.is]: null } },
                                        { ad_end_date: { [Op.gte]: new Date() } }
                                    ]
                                }
                            ]
                        },
                        required: false, // Mantenemos esto en false, es una buena práctica.
                        attributes: ['ad_id', 'ad_name', 'ad_image_url', 'ad_target_url', 'ad_type', 'ad_is_active', 'ad_start_date', 'ad_end_date'],
                        through: { attributes: ['position'] }
                    }],
                    order: [[{ model: Advertisement, as: 'advertisements' }, SectionAdvertisementMap, 'position', 'ASC']]
                });
                return { status: 'success', section_type: section.section_type, items: withAds ? withAds.advertisements || [] : [] };

            } else if (section.section_type === 'shorts') {
                // Lógica para Shorts
                const withShorts = await SectionArticles.findByPk(section.section_code, {
                    include: [{ model: Short, as: 'shorts', through: { attributes: ['position'] } }],
                    order: [[{ model: Short, as: 'shorts' }, SectionShortMap, 'position', 'ASC']]
                });
                return { status: 'success', section_type: section.section_type, items: withShorts ? withShorts.shorts || [] : [] };

            } else if (section.section_type === 'sideaudios') {
                // Lógica para Audios
                const withAudios = await SectionArticles.findByPk(section.section_code, {
                    include: [{
                        model: Audio,
                        as: 'audios',
                        // required: false es una buena práctica para que la sección principal no desaparezca
                        // si accidentalmente se borran todos sus audios asociados.
                        required: false,
                        through: { attributes: ['position'] }
                    }],
                    order: [[{ model: Audio, as: 'audios' }, SectionAudioMap, 'position', 'ASC']]
                });

                // console.log('RESULTADO DE LA CONSULTA DE AUDIOS:', JSON.stringify(withAudios, null, 2));

                return {
                    status: 'success',
                    section_type: section.section_type,
                    items: withAudios ? (withAudios.audios || []).map(audio => audio.toJSON()) : []
                };

            } else {
                // Default: Lógica para Artículos
                const withArticles = await SectionArticles.findByPk(section.section_code, {
                    include: [{
                        model: Article, as: 'articles', required: false, through: { attributes: ['position'] },
                        include: [
                            { model: User, as: 'author', attributes: ['user_code', 'user_name', 'user_lastname'] },
                            { model: ArticleCategory, as: 'category', attributes: ['category_code', 'category_name'] }
                        ]
                    }],
                    order: [[{ model: Article, as: 'articles' }, SectionArticleMap, 'position', 'ASC']]
                });
                return {
                    status: 'success',
                    section_type: section.section_type,
                    items: withArticles ? (withArticles.articles || []).map(article => ({
                        article_code: article.article_code,
                        article_slug: article.article_slug,
                        title: article.article_title,
                        excerpt: article.article_excerpt,
                        image: article.article_image_url,
                        category: article.category?.category_name || null,
                        author: article.author ? `${article.author.user_name} ${article.author.user_lastname}` : null,
                        date: article.article_published_at,
                        is_premium: article.article_is_premium,
                        position: article.SectionArticleMap.position
                    })) : []
                };
            }
        });

        // ===================================================================

        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).json(data);

    } catch (error) {
        console.error('[Sections][GetItems]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los ítems de la sección.'
        });
    }
};


/*// src/controllers/sections/getSectionItems.js
const SectionArticles = require('../../models/sectionarticles');
const Article = require('../../models/article');
const Short = require('../../models/short');
const SectionArticleMap = require('../../models/sectionarticlemap');    // pivot para artículos
const SectionShortMap = require('../../models/sectionshortmap');  // pivot para shorts
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = `sections:${slug}:items`;

        const data = await getOrSetCache(cacheKey, async () => {
            // 1. Cargar sección
            const section = await SectionArticles.findOne({
                where: { section_slug: slug }
            });
            if (!section) {
                return null;
            }

            // 2. Según tipo, cargar items con posición
            if (section.section_type === 'shorts') {
                const withShorts = await SectionArticles.findOne({
                    where: { section_slug: slug },
                    include: [{
                        model: Short,
                        as: 'shorts',
                        through: { attributes: ['position'] }
                    }],
                    order: [[{ model: Short, as: 'shorts' }, SectionShortMap, 'position', 'ASC']]
                });
                return {
                    status: 'success',
                    items: withShorts.shorts
                };
            }

            // default: artículos
            const withArticles = await SectionArticles.findOne({
                where: { section_slug: slug },
                include: [{
                    model: Article,
                    as: 'articles',
                    through: { attributes: ['position'] },
                    include: [
                        { model: require('../../models/user'), as: 'author', attributes: ['user_code', 'user_name', 'user_lastname'] },
                        { model: require('../../models/articlecategory'), as: 'category', attributes: ['category_code', 'category_name'] }
                    ]
                }],
                order: [[{ model: Article, as: 'articles' }, SectionArticleMap, 'position', 'ASC']]
            });
            return {
                status: 'success',
                items: withArticles.articles.map(article => ({
                    article_code: article.article_code,
                    title: article.article_title,
                    excerpt: article.article_excerpt,
                    image: article.article_image_url,
                    category: article.category?.category_name || null,
                    author: article.author
                        ? `${article.author.user_name} ${article.author.user_lastname}`
                        : null,
                    date: article.article_published_at,
                    url: `/articulos/${article.article_slug}`,
                    is_premium: article.article_is_premium
                }))
            };


        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Sección no encontrada.'
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('[Sections][GetItems]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los ítems de la sección.'
        });
    }
};
*/