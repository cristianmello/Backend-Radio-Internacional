// src/controllers/sectionsController.js
// src/controllers/sectionsController.js

const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const Section = require('../../models/sectionarticles');
// 1. Importamos el helper para el caché de Redis
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    try {
        const sectionSlug = req.params.sectionSlug || 'maincontent';
        const categorySlug = req.query.category;

        // 2. Creamos una clave de caché dinámica
        // Es MUY IMPORTANTE que la clave incluya los parámetros que cambian la consulta,
        // para no servir una lista de "deportes" a alguien que pidió "política".
        const cacheKey = `section-articles:${sectionSlug}:category:${categorySlug || 'all'}`;

        // 3. Usamos el helper para obtener los datos
        const articles = await getOrSetCache(cacheKey, async () => {
            // Esta función solo se ejecuta si los datos no están en el caché de Redis.
            // Es la consulta original a tu base de datos.
            const categoryWhere = categorySlug
                ? { category_slug: categorySlug }
                : {};

            return Article.findAll({
                where: { article_is_published: true },
                include: [
                    {
                        model: Section,
                        as: 'sections',
                        where: { section_slug: sectionSlug },
                        through: { attributes: [] }
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        where: categoryWhere,
                        attributes: ['category_slug', 'category_name']
                    }
                ],
                order: [['article_published_at', 'DESC']]
            });
        }, 300); // Expiración de 5 minutos (300s) para la lista de artículos

        // 4. Establecemos la cabecera para el caché del navegador del cliente
        // Como es una lista de artículos que puede cambiar, usamos un tiempo corto.
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');

        // 5. Enviamos la respuesta final
        return res.status(200).json({ data: articles });

    } catch (err) {
        console.error('Error fetching section articles:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
/*
const Article = require('../../models/article');
const ArticleCategory = require('../../models/articlecategory');
const Section = require('../../models/sectionarticles');

module.exports = async (req, res) => {
    // Fijamos la sección principal si no viene por parámetro
    const sectionSlug = req.params.sectionSlug || 'maincontent';
    const categorySlug = req.query.category;

    try {
        // 1) Construimos la condición para la categoría
        const categoryWhere = categorySlug
            ? { category_slug: categorySlug }
            : {};

        // 2) Obtenemos los artículos publicados que estén en la sección "maincontent"
        //    y, si aplica, en la categoría seleccionada
        const articles = await Article.findAll({
            where: { article_is_published: true },
            include: [
                {
                    model: Section,
                    as: 'sections',
                    where: { section_slug: sectionSlug },
                    through: { attributes: [] }
                },
                {
                    model: ArticleCategory,
                    as: 'category',
                    where: categoryWhere,
                    attributes: ['category_slug', 'category_name']
                }
            ],
            order: [['article_published_at', 'DESC']]
        });

        return res.json({ data: articles });
    } catch (err) {
        console.error('Error fetching section articles:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
*/