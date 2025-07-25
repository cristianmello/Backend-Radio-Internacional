const { Op } = require('sequelize');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');
const Article = require('./models/article');
const ArticleCategory = require('./models/articlecategory');

async function buildSitemap() {
    // 1) Ruta hacia el sitemap público
    const sitemapPath = path.resolve(__dirname, './public/sitemap.xml');
    const writeStream = createWriteStream(sitemapPath);
    const sitemap = new SitemapStream({ hostname: 'https://realidadnacional.net' });
    sitemap.pipe(writeStream);

    // 2) Rutas estáticas
    const now = new Date().toISOString();
    [
        { url: '/', lastmod: now },
        { url: '/politica-de-privacidad', lastmod: now },
       // { url: '/about', lastmod: now },
        //{ url: '/contact', lastmod: now },
    ].forEach(page => sitemap.write(page));

    // 3) Rutas de categoría: /categoria/:category
    const categories = await ArticleCategory.findAll({
        attributes: ['category_slug', 'updated_at'],
        where: {
            // Le decimos que busque todas las categorías cuyo slug NO SEA 'inicio'
            category_slug: {
                [Op.ne]: 'inicio'
            }
        },
        raw: true
    });
    categories.forEach(cat => {
        sitemap.write({
            url: `/categoria/${cat.category_slug}`,
            lastmod: new Date(cat.updated_at).toISOString(),
        });
    });

    // 4) Rutas de artículo: /articulos/:code/:slug
    const articles = await Article.findAll({
        attributes: ['article_code', 'article_slug', 'updated_at'],
        where: { article_is_published: true },
        raw: true
    });
    articles.forEach(art => {
        sitemap.write({
            url: `/articulos/${art.article_code}/${art.article_slug}`,
            lastmod: new Date(art.updated_at).toISOString(),
        });
    });


    // 5) Cierra y guarda
    sitemap.end();
    await streamToPromise(sitemap);

    console.log('✅ sitemap.xml generado en public/');
}

module.exports = { buildSitemap };

