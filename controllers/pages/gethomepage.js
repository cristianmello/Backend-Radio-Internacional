const { Op } = require('sequelize');
const Section = require('../../models/sectionarticles');
const Article = require('../../models/article');
const Audio = require('../../models/audios');
const Advertisement = require('../../models/advertisement');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');
// Importamos las tablas de mapeo para el orden
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const cacheKey = 'pages:home';

        const data = await getOrSetCache(cacheKey, async () => {
            // Usamos Promise.all para buscar secciones y categorías al mismo tiempo
            const [sectionsWithContent, categories] = await Promise.all([

                // --- TAREA 1: Obtener secciones con su contenido ---
                (async () => {
                    const sections = await Section.findAll({
                        order: [['section_position', 'ASC']],
                        raw: true,
                    });

                    // Hacemos un bucle sobre cada sección y buscamos su contenido específico
                    return Promise.all(
                        sections.map(async (section) => {
                            let items = [];
                            const adTypes = ['ad-large', 'ad-small', 'ad-banner', 'ad-skyscraper', 'ad-biglarge', 'ad-verticalsm'];

                            if (adTypes.includes(section.section_type)) {
                                // Lógica para Publicidad (con orden y fechas correctas)
                                const withAds = await Section.findByPk(section.section_code, {
                                    include: [{
                                        model: Advertisement, as: 'advertisements', required: false,
                                        where: {
                                            ad_is_active: true,
                                            [Op.and]: [
                                                { [Op.or]: [{ ad_start_date: { [Op.is]: null } }, { ad_start_date: { [Op.lte]: new Date() } }] },
                                                { [Op.or]: [{ ad_end_date: { [Op.is]: null } }, { ad_end_date: { [Op.gte]: new Date() } }] }
                                            ]
                                        },
                                        through: { attributes: ['position'] }
                                    }],
                                    order: [[{ model: Advertisement, as: 'advertisements' }, SectionAdvertisementMap, 'position', 'ASC']]
                                });
                                items = withAds ? withAds.advertisements || [] : [];
                            } else if (section.section_type === 'sideaudios') {
                                // Lógica para Audios (con orden correcto)
                                const withAudios = await Section.findByPk(section.section_code, {
                                    include: [{ model: Audio, as: 'audios', required: false, through: { attributes: ['position'] } }],
                                    order: [[{ model: Audio, as: 'audios' }, SectionAudioMap, 'position', 'ASC']]
                                });
                                items = withAudios ? (withAudios.audios || []).map(audio => audio.toJSON()) : [];
                            } else {
                                // Lógica para Artículos (con orden correcto y formato de datos)
                                const withArticles = await Section.findByPk(section.section_code, {
                                    include: [{
                                        model: Article, as: 'articles', required: false, where: { article_is_published: true }, through: { attributes: ['position'] },
                                        include: [
                                            { model: User, as: 'author', attributes: ['user_name', 'user_lastname'] },
                                            { model: ArticleCategory, as: 'category', attributes: ['category_name'] }
                                        ]
                                    }],
                                    order: [[{ model: Article, as: 'articles' }, SectionArticleMap, 'position', 'ASC']]
                                });

                                items = withArticles ? (withArticles.articles || []).map(article => ({
                                    article_code: article.article_code,
                                    article_slug: article.article_slug,
                                    title: article.article_title,
                                    excerpt: article.article_excerpt,
                                    image: article.article_image_url,
                                    category: article.category?.category_name || null,
                                    author: article.author ? `${article.author.user_name} ${article.author.user_lastname}` : null,
                                    date: article.article_published_at,
                                })) : [];
                            }

                            return { ...section, items };
                        })
                    );
                })(),

                // --- TAREA 2: Obtener todas las categorías ---
                ArticleCategory.findAll({
                    order: [['category_code', 'ASC']],
                    attributes: ['category_code', 'category_name', 'category_slug'],
                    raw: true,
                })
            ]);

            // Devolvemos el objeto completo para guardarlo en caché
            return {
                sections: sectionsWithContent,
                categories: categories,
            };
        }, 300); // 300 segundos = 5 minutos de caché

        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).json(data);

    } catch (error) {
        console.error('[GetHomePage Controller]', error);
        res.status(500).json({ message: 'Error al obtener los datos de la página de inicio.' });
    }
};