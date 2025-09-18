const { Op } = require('sequelize');
const Section = require('../../models/sectionarticles');
const Article = require('../../models/article');
const Audio = require('../../models/audios');
const Advertisement = require('../../models/advertisement');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');
const Short = require('../../models/short');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionAudioMap = require('../../models/sectionaudiomap');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');
const SectionShortMap = require('../../models/sectionshortmap');

const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const cacheKey = 'pages:home';

        const data = await getOrSetCache(cacheKey, async () => {
            const [allSections, allCategories] = await Promise.all([
                Section.findAll({
                    include: [
                        {
                            model: Article,
                            as: 'articles',
                            limit: 15,
                            where: { article_is_published: true },
                            required: false, // LEFT JOIN
                            through: { attributes: [] },
                            include: [
                                { model: User, as: 'author', attributes: ['user_name', 'user_lastname'] },
                                { model: ArticleCategory, as: 'category', attributes: ['category_name', 'category_slug'] }
                            ]
                        },
                        {
                            model: Short,
                            as: 'shorts',
                            where: { short_is_published: true },
                            required: false, // LEFT JOIN
                            through: { attributes: [] },
                            include: [ // Los shorts también pueden tener autor y categoría
                                { model: User, as: 'author', attributes: ['user_name', 'user_lastname'] },
                                { model: ArticleCategory, as: 'category', attributes: ['category_name', 'category_slug'] }
                            ]
                        },
                        {
                            model: Audio,
                            as: 'audios',
                            required: false, // LEFT JOIN
                            through: { attributes: [] }
                        },
                        {
                            model: Advertisement,
                            as: 'advertisements',
                            where: {
                                ad_is_active: true,
                                [Op.and]: [
                                    { [Op.or]: [{ ad_start_date: { [Op.is]: null } }, { ad_start_date: { [Op.lte]: new Date() } }] },
                                    { [Op.or]: [{ ad_end_date: { [Op.is]: null } }, { ad_end_date: { [Op.gte]: new Date() } }] }
                                ]
                            },
                            required: false, // LEFT JOIN
                            through: { attributes: [] }
                        }
                    ],
                    // Se ordena por la posición de la sección y luego por la posición de los ítems dentro de cada relación
                    order: [
                        ['section_position', 'ASC'],
                        [{ model: Article, as: 'articles' }, SectionArticleMap, 'position', 'ASC'],
                        [{ model: Short, as: 'shorts' }, SectionShortMap, 'position', 'ASC'], // <--- 4. Añadir orden para Shorts
                        [{ model: Audio, as: 'audios' }, SectionAudioMap, 'position', 'ASC'],
                        [{ model: Advertisement, as: 'advertisements' }, SectionAdvertisementMap, 'position', 'ASC']
                    ]
                }),

                ArticleCategory.findAll({
                    order: [['category_code', 'ASC']],
                    attributes: ['category_code', 'category_name', 'category_slug'],
                    raw: true,
                })
            ]);

            const sectionsWithContent = allSections.map(section => {
                const sectionJSON = section.toJSON();
                let items = [];
                const adTypes = ['ad-large', 'ad-small', 'ad-banner', 'ad-skyscraper', 'ad-biglarge', 'ad-verticalsm'];

                if (adTypes.includes(sectionJSON.section_type)) {
                    items = sectionJSON.advertisements || [];
                } else if (sectionJSON.section_type === 'shorts') {
                    items = (sectionJSON.shorts || []).map(short => ({
                        short_code: short.short_code,
                        slug: short.short_slug,
                        title: short.short_title,
                        video_url: short.short_video_url,
                        duration: short.short_duration,
                        author: short.author ? `${short.author.user_name} ${short.author.user_lastname}`.trim() : null,
                        category_name: short.category?.category_name || null,
                        date: short.short_published_at
                    }));
                } else if (sectionJSON.section_type === 'sideaudios') {
                    items = (sectionJSON.audios || []).map(audio => ({
                        audio_code: audio.audio_code,
                        slug: audio.audio_slug,
                        title: audio.audio_title,
                        audio_url: audio.audio_url,
                        duration: audio.audio_duration,
                        author: audio.author ? `${audio.author.user_name} ${audio.author.user_lastname}`.trim() : null,
                        category_name: audio.category?.category_name || null,
                        date: audio.audio_published_at
                    }));
                } else {
                    items = (sectionJSON.articles || []).map(article => ({
                        article_code: article.article_code,
                        slug: article.article_slug,
                        title: article.article_title,
                        excerpt: article.article_excerpt,
                        image: article.article_image_url,
                        category_name: article.category?.category_name || null,
                        category_slug: article.category?.category_slug || null,
                        author: article.author ? `${article.author.user_name} ${article.author.user_lastname}`.trim() : null,
                        date: article.article_published_at,
                    }));
                }

                // Limpiamos los datos que no se usarán en el frontend para aligerar la respuesta
                delete sectionJSON.articles;
                delete sectionJSON.shorts;
                delete sectionJSON.audios;
                delete sectionJSON.advertisements;

                return { ...sectionJSON, items };
            });

            return {
                sections: sectionsWithContent,
                categories: allCategories,
            };
        }, 300); // 5 minutos de caché

        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).json(data);

    } catch (error) {
        console.error('[GetHomePage Controller]', error);
        res.status(500).json({ message: 'Error al obtener los datos de la página de inicio.' });
    }
};