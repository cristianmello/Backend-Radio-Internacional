// src/controllers/sections/addItemToSection.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const Article = require('../../models/article');
const Short = require('../../models/short');
const SectionLog = require('../../models/sectionlog');
const Audio = require('../../models/audios');
const SectionAudioMap = require('../../models/sectionaudiomap');
const Advertisement = require('../../models/advertisement');
const SectionAdvertisementMap = require('../../models/sectionadvertisementmap');
const redisClient = require('../../services/redisclient');
const { Op } = require('sequelize');

// Helper para limpiar caché de forma segura con SCAN
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
    // 1. Inicia transacción
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;
        const { code } = req.body;  // puede ser article_code o short_code

        // 2. Cargar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        let position, newItem;

        const adTypes = ['ad-large', 'ad-small', 'ad-banner', 'ad-skyscraper', 'ad-biglarge', 'ad-verticalsm',];

        if (adTypes.includes(section.section_type)) {
            const newAd = await Advertisement.findByPk(code, { transaction: t });
            if (!newAd) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Publicidad no encontrada.' });
            }

            // --- PASO 1: OBTENER ANUNCIOS EXISTENTES EN LA SECCIÓN ---
            // Buscamos todos los mapeos de la sección para obtener los IDs de los anuncios actuales.
            const existingAdsMap = await SectionAdvertisementMap.findAll({
                where: { section_code: section.section_code },
                attributes: ['ad_id'],
                transaction: t
            });

            const existingAdIds = existingAdsMap.map(map => map.ad_id);

            // --- PASO 2: VERIFICAR CONFLICTO DE VIGENCIA ---
            if (existingAdIds.length > 0) {
                // Buscamos si algún anuncio existente tiene fechas que se solapan con el nuevo.
                const conflictingAd = await Advertisement.findOne({
                    where: {
                        ad_id: { [Op.in]: existingAdIds }, // Solo buscar en los anuncios de esta sección
                        ad_is_active: true, // Opcional: solo considerar conflictos con anuncios activos

                        // La lógica de solapamiento:
                        // (InicioAnuncioExistente < FinAnuncioNuevo) Y (FinAnuncioExistente > InicioAnuncioNuevo)
                        // Se deben manejar los casos donde las fechas son NULL (vigencia infinita).
                        [Op.and]: [
                            {
                                // La fecha de inicio del anuncio existente debe ser anterior a la de fin del nuevo.
                                // Si el nuevo anuncio no tiene fecha de fin (newAd.ad_end_date es NULL), cualquier anuncio existente con fecha de inicio entrará en conflicto.
                                ad_start_date: {
                                    [Op.lt]: newAd.ad_end_date || new Date(8640000000000000) // Fecha máxima si es null
                                }
                            },
                            {
                                // La fecha de fin del anuncio existente debe ser posterior a la de inicio del nuevo.
                                // Si el anuncio existente no tiene fecha de fin (es NULL), siempre será posterior.
                                [Op.or]: [
                                    { ad_end_date: { [Op.gt]: newAd.ad_start_date || new Date(-8640000000000000) } }, // Fecha mínima si es null
                                    { ad_end_date: null }
                                ]
                            }
                        ]
                    },
                    transaction: t
                });

                // Si se encontró un anuncio conflictivo, devolvemos un error.
                if (conflictingAd) {
                    await t.rollback();
                    return res.status(400).json({
                        status: 'error',
                        message: `Conflicto de vigencia. Las fechas se solapan con la publicidad "${conflictingAd.ad_name}".`
                    });
                }
            }

            // Chequeo duplicado (tu código original, sigue siendo necesario)
            const existsAd = await SectionAdvertisementMap.findOne({
                where: { section_code: section.section_code, ad_id: code },
                transaction: t
            });
            if (existsAd) {
                await t.rollback();
                return res.status(400).json({ status: 'error', message: 'Esta publicidad ya está en la sección.' });
            }

            // --- PASO 3: AÑADIR EL ANUNCIO (tu lógica original) ---
            await SectionAdvertisementMap.update(
                { position: SectionAdvertisementMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            position = 0;
            await SectionAdvertisementMap.create({
                section_code: section.section_code,
                ad_id: code,
                position
            }, { transaction: t });

            newItem = {
                ad_id: newAd.ad_id,
                ad_name: newAd.ad_name,
                ad_image_url: newAd.ad_image_url,
                ad_target_url: newAd.ad_target_url,
                ad_type: newAd.ad_type,
                position
            };
            /*            const ad = await Advertisement.findByPk(code, { transaction: t });
                        if (!ad) {
                            await t.rollback();
                            return res.status(404).json({ status: 'error', message: 'Publicidad no encontrada.' });
                        }
            
                        // Chequeo duplicado
                        const existsAd = await SectionAdvertisementMap.findOne({
                            where: { section_code: section.section_code, ad_id: code },
                            transaction: t
                        });
                        if (existsAd) {
                            await t.rollback();
                            return res.status(400).json({ status: 'error', message: 'Esta publicidad ya está en la sección.' });
                        }
            
                        // Desplazar posiciones
                        await SectionAdvertisementMap.update(
                            { position: SectionAdvertisementMap.sequelize.literal('position + 1') },
                            { where: { section_code: section.section_code }, transaction: t }
                        );
            
                        // Insertar en posición 0
                        position = 0;
                        await SectionAdvertisementMap.create({
                            section_code: section.section_code,
                            ad_id: code,
                            position
                        }, { transaction: t });
            
                        // Serializar el nuevo item para la respuesta
                        newItem = {
                            ad_id: ad.ad_id,
                            ad_name: ad.ad_name,
                            ad_image_url: ad.ad_image_url,
                            ad_target_url: ad.ad_target_url,
                            ad_type: ad.ad_type,
                            position
                        };
            */
        } else if (section.section_type === 'shorts') {
            // --- SHORTS ---
            const short = await Short.findByPk(code, { transaction: t });
            if (!short) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Short no encontrado.' });
            }

            // —————— CHEQUEO DUPLICADO ——————
            const existsShort = await SectionShortMap.findOne({
                where: {
                    section_code: section.section_code,
                    short_code: code
                },
                transaction: t
            });
            if (existsShort) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este short ya está publicado en la sección.'
                });
            }

            // determinar posición
            // 3.x. Desplaza todos los shorts existentes +1
            await SectionShortMap.update(
                { position: SectionShortMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // 3.y. Inserta el nuevo short en la posición 0
            position = 0;
            await SectionShortMap.create({
                section_code: section.section_code,
                short_code: code,
                position
            }, { transaction: t });


            // 4a. Marcar como publicado y fijar fecha si es necesario
            await Short.update(
                {
                    short_is_published: true,
                    short_published_at: short.short_published_at || new Date()
                },
                { where: { short_code: code }, transaction: t }
            );

            await clearByPattern('shorts:drafts:*'); // Invalidación para drafts de shorts

            // 5a. Serializar newItem dentro de la transacción
            newItem = {
                short_code: short.short_code,
                title: short.short_title,
                url: `/shorts/${short.short_slug}`,
                position
            };

        } else if (section.section_type === 'sideaudios') {
            // --- AUDIOS ---
            const audio = await Audio.findByPk(code, { transaction: t });
            if (!audio) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Audio no encontrado.' });
            }

            // Chequeo duplicado
            const existsAudio = await SectionAudioMap.findOne({
                where: { section_code: section.section_code, audio_code: code },
                transaction: t
            });
            if (existsAudio) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este audio ya está publicado en la sección.'
                });
            }

            // Desplazar posiciones +1
            await SectionAudioMap.update(
                { position: SectionAudioMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // Insertar en posición 0
            position = 0;
            await SectionAudioMap.create({
                section_code: section.section_code,
                audio_code: code,
                position
            }, { transaction: t });

            // Marcar como publicado y fijar fecha si falta
            await Audio.update(
                {
                    audio_is_published: true,
                    audio_published_at: audio.audio_published_at || new Date()
                },
                { where: { audio_code: code }, transaction: t }
            );

            await clearByPattern('draftsaudios:*');
            await clearByPattern('audios:*');

            // Serializar newItem
            newItem = {
                audio_code: audio.audio_code,
                title: audio.audio_title,
                url: `/audios/${audio.audio_slug}`,
                duration: audio.audio_duration,
                position
            };
        }


        else {
            // --- ARTÍCULOS ---
            const article = await Article.findByPk(code, { transaction: t });
            if (!article) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Artículo no encontrado.' });
            }

            // —————— CHEQUEO DUPLICADO ——————
            const existsArticle = await SectionArticleMap.findOne({
                where: {
                    section_code: section.section_code,
                    article_code: code
                },
                transaction: t
            });
            if (existsArticle) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este artículo ya está publicado en la sección.'
                });
            }

            // determinar posición
            // 3.x. Desplaza todas las posiciones +1
            await SectionArticleMap.update(
                { position: SectionArticleMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // 3.y. Inserta el nuevo artículo en posición 0
            position = 0;
            await SectionArticleMap.create({
                section_code: section.section_code,
                article_code: code,
                position
            }, { transaction: t });


            // 4b. Marcar como publicado y fijar fecha si es necesario
            await Article.update(
                {
                    article_is_published: true,
                    article_published_at: article.article_published_at || new Date()
                },
                { where: { article_code: code }, transaction: t }
            );

            await clearByPattern('drafts:*');
            await clearByPattern(`available_articles:section=${slug}:*`);


            // 5b. Recuperar artículo con relaciones para serializar
            const fullArticle = await Article.findByPk(code, {
                attributes: [
                    'article_code',
                    'article_title',
                    'article_excerpt',
                    'article_image_url',
                    'article_slug',
                    'article_published_at',
                    'article_is_premium'
                ],
                include: [
                    {
                        model: require('../../models/user'),
                        as: 'author',
                        attributes: ['user_name', 'user_lastname']
                    },
                    {
                        model: require('../../models/articlecategory'),
                        as: 'category',
                        attributes: ['category_name']
                    }
                ],
                transaction: t
            });

            newItem = {
                article_code: fullArticle.article_code,
                title: fullArticle.article_title,
                excerpt: fullArticle.article_excerpt,
                image: fullArticle.article_image_url,
                category: fullArticle.category?.category_name || null,
                author: fullArticle.author
                    ? `${fullArticle.author.user_name} ${fullArticle.author.user_lastname}`
                    : null,
                date: fullArticle.article_published_at,
                url: `/articulos/${fullArticle.article_slug}`,
                is_premium: fullArticle.article_is_premium,
                position
            };
        }

        // 6. Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'add_item',
                details: JSON.stringify(newItem),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 7. Commit
        await t.commit();

        // 8. Invalidar orden y lista de items de la sección
        await clearByPattern(`sections:${slug}:items`);

        // 9. Invalidar paginados de artículos de esta sección
        await clearByPattern(`available_articles:section=${slug}:*`);

        // 8. Invalida caché (no crítico)
        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (e) {
            console.warn(`Error limpiando caché sections:${slug}:items`, e);
        }

        // 9. Responder con el nuevo ítem
        return res.status(201).json({
            status: 'success',
            item: newItem
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][AddItem]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al agregar ítem a la sección.'
        });
    }
};



/*// src/controllers/sections/addItemToSection.js
const SectionArticles = require('../../models/sectionarticles');
const SectionArticleMap = require('../../models/sectionarticlemap');
const SectionShortMap = require('../../models/sectionshortmap');
const Article = require('../../models/article');
const Short = require('../../models/short');
const SectionLog = require('../../models/sectionlog');
const Audio = require('../../models/audios');
const SectionAudioMap = require('../../models/sectionaudiomap');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res) => {
    // 1. Inicia transacción
    const t = await SectionArticles.sequelize.transaction();
    try {
        const { slug } = req.params;
        const { code } = req.body;  // puede ser article_code o short_code

        // 2. Cargar sección
        const section = await SectionArticles.findOne({
            where: { section_slug: slug },
            transaction: t
        });
        if (!section) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Sección no encontrada.' });
        }

        let position, newItem;

        if (section.section_type === 'shorts') {
            // --- SHORTS ---
            const short = await Short.findByPk(code, { transaction: t });
            if (!short) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Short no encontrado.' });
            }

            // —————— CHEQUEO DUPLICADO ——————
            const existsShort = await SectionShortMap.findOne({
                where: {
                    section_code: section.section_code,
                    short_code: code
                },
                transaction: t
            });
            if (existsShort) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este short ya está publicado en la sección.'
                });
            }

            // determinar posición
            // 3.x. Desplaza todos los shorts existentes +1
            await SectionShortMap.update(
                { position: SectionShortMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // 3.y. Inserta el nuevo short en la posición 0
            position = 0;
            await SectionShortMap.create({
                section_code: section.section_code,
                short_code: code,
                position
            }, { transaction: t });


            // 4a. Marcar como publicado y fijar fecha si es necesario
            await Short.update(
                {
                    short_is_published: true,
                    short_published_at: short.short_published_at || new Date()
                },
                { where: { short_code: code }, transaction: t }
            );

            try {
                const keys = await redisClient.keys('shorts:drafts:*');
                if (keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            } catch (e) {
                console.warn('Error invalidando caché drafts:', e);
            }

            // 5a. Serializar newItem dentro de la transacción
            newItem = {
                short_code: short.short_code,
                title: short.short_title,
                url: `/shorts/${short.short_slug}`,
                position
            };

        } else if (section.section_type === 'sideaudios') {
            // --- AUDIOS ---
            const audio = await Audio.findByPk(code, { transaction: t });
            if (!audio) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Audio no encontrado.' });
            }

            // Chequeo duplicado
            const existsAudio = await SectionAudioMap.findOne({
                where: { section_code: section.section_code, audio_code: code },
                transaction: t
            });
            if (existsAudio) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este audio ya está publicado en la sección.'
                });
            }

            // Desplazar posiciones +1
            await SectionAudioMap.update(
                { position: SectionAudioMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // Insertar en posición 0
            position = 0;
            await SectionAudioMap.create({
                section_code: section.section_code,
                audio_code: code,
                position
            }, { transaction: t });

            // Marcar como publicado y fijar fecha si falta
            await Audio.update(
                {
                    audio_is_published: true,
                    audio_published_at: audio.audio_published_at || new Date()
                },
                { where: { audio_code: code }, transaction: t }
            );

            // Invalidar cache de audios (si usas keys similares)
            try {
                const keys = await redisClient.keys('audios:*');
                if (keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            } catch (e) {
                console.warn('Error invalidando caché audios:', e);
            }

            // Serializar newItem
            newItem = {
                audio_code: audio.audio_code,
                title: audio.audio_title,
                url: `/audios/${audio.audio_slug}`,
                duration: audio.audio_duration,
                position
            };
        }


        else {
            // --- ARTÍCULOS ---
            const article = await Article.findByPk(code, { transaction: t });
            if (!article) {
                await t.rollback();
                return res.status(404).json({ status: 'error', message: 'Artículo no encontrado.' });
            }

            // —————— CHEQUEO DUPLICADO ——————
            const existsArticle = await SectionArticleMap.findOne({
                where: {
                    section_code: section.section_code,
                    article_code: code
                },
                transaction: t
            });
            if (existsArticle) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Este artículo ya está publicado en la sección.'
                });
            }

            // determinar posición
            // 3.x. Desplaza todas las posiciones +1
            await SectionArticleMap.update(
                { position: SectionArticleMap.sequelize.literal('position + 1') },
                { where: { section_code: section.section_code }, transaction: t }
            );

            // 3.y. Inserta el nuevo artículo en posición 0
            position = 0;
            await SectionArticleMap.create({
                section_code: section.section_code,
                article_code: code,
                position
            }, { transaction: t });


            // 4b. Marcar como publicado y fijar fecha si es necesario
            await Article.update(
                {
                    article_is_published: true,
                    article_published_at: article.article_published_at || new Date()
                },
                { where: { article_code: code }, transaction: t }
            );

            try {
                const keys = await redisClient.keys('drafts:*');
                if (keys.length) await Promise.all(keys.map(k => redisClient.del(k)));
            } catch (e) {
                console.warn('Error invalidando caché drafts para artículos:', e);
            }

            // 5b. Recuperar artículo con relaciones para serializar
            const fullArticle = await Article.findByPk(code, {
                attributes: [
                    'article_code',
                    'article_title',
                    'article_excerpt',
                    'article_image_url',
                    'article_slug',
                    'article_published_at',
                    'article_is_premium'
                ],
                include: [
                    {
                        model: require('../../models/user'),
                        as: 'author',
                        attributes: ['user_name', 'user_lastname']
                    },
                    {
                        model: require('../../models/articlecategory'),
                        as: 'category',
                        attributes: ['category_name']
                    }
                ],
                transaction: t
            });

            newItem = {
                article_code: fullArticle.article_code,
                title: fullArticle.article_title,
                excerpt: fullArticle.article_excerpt,
                image: fullArticle.article_image_url,
                category: fullArticle.category?.category_name || null,
                author: fullArticle.author
                    ? `${fullArticle.author.user_name} ${fullArticle.author.user_lastname}`
                    : null,
                date: fullArticle.article_published_at,
                url: `/articulos/${fullArticle.article_slug}`,
                is_premium: fullArticle.article_is_premium,
                position
            };
        }

        // 6. Log de auditoría (opcional)
        if (req.user) {
            await SectionLog.create({
                user_id: req.user.id,
                section_code: section.section_code,
                action: 'add_item',
                details: JSON.stringify(newItem),
                timestamp: new Date()
            }, { transaction: t });
        }

        // 7. Commit
        await t.commit();

        // 8. Invalida caché (no crítico)
        try {
            await redisClient.del(`sections:${slug}:items`);
        } catch (e) {
            console.warn(`Error limpiando caché sections:${slug}:items`, e);
        }

        // 9. Responder con el nuevo ítem
        return res.status(201).json({
            status: 'success',
            item: newItem
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[Sections][AddItem]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al agregar ítem a la sección.'
        });
    }
};
*/