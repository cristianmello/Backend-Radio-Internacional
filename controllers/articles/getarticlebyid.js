const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        // 1. Obtenemos tanto el 'id' como el 'slug' de los parámetros de la URL
        const { id, slug } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(404).json({ // Usamos 404 ya que la ruta no existe
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        const cacheKey = `article:${id}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // La búsqueda principal sigue siendo por ID (findByPk), es la más rápida
            const article = await Article.findByPk(id, {
                include: [
                    { model: User, as: 'author', attributes: ['user_code', 'user_name', 'user_lastname'] },
                    { model: ArticleCategory, as: 'category', attributes: ['category_code', 'category_name'] }
                ],
            });
            //cambie esto solo sacar toJSON()
            if (!article) {
                return null;
            }
            return article.toJSON();
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        if (data.article_slug !== slug) {
            // Construye la URL correcta usando la variable de entorno CLIENT_URL
            const canonicalUrl = `${process.env.CLIENT_URL}/articulos/${data.article_code}/${data.article_slug}`;

            // Redirección 301 (Movido Permanentemente), ideal para SEO
            return res.redirect(301, canonicalUrl);
        }


        // 2. LA MAGIA DEL SEO: Verificación de la URL Canónica
        // Si el slug de la URL no coincide con el slug actual en la base de datos,
        // hacemos una redirección permanente (301).
        /* ESTO SE CAMBIO FUNCIONABA HASTA HACER EL USERELATEDARTICLES
         if (data.article_slug !== slug) {
             // ¡Importante! La redirección debe ser a la URL del FRONTEND, no de la API.
             const canonicalUrl = `/articulos/${data.article_code}/${data.article_slug}`;
             return res.redirect(301, canonicalUrl);
         }
             */

        // 3. Si la URL es correcta, devolvemos la respuesta JSON como siempre.
        res.set('Cache-Control', 'public, max-age=300, s-maxage=900');

        res.status(200).json({
            status: 'success',
            article: data, // 'data' aquí es el objeto 'article' del caché/búsqueda
        });

    } catch (error) {
        console.error('[Articles][GetById-Canonical]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el artículo.',
        });
    }
};

/* FUNCIONANDO POR PRODUCCION
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        // 1. Obtenemos tanto el 'id' como el 'slug' de los parámetros de la URL
        const { id, slug } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(404).json({ // Usamos 404 ya que la ruta no existe
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        const cacheKey = `article:${id}`;

        const data = await getOrSetCache(cacheKey, async () => {
            // La búsqueda principal sigue siendo por ID (findByPk), es la más rápida
            const article = await Article.findByPk(id, {
                include: [
                    { model: User, as: 'author', attributes: ['user_code', 'user_name', 'user_lastname'] },
                    { model: ArticleCategory, as: 'category', attributes: ['category_code', 'category_name'] }
                ],
            });
            //cambie esto solo sacar toJSON()
            if (!article) {
                return null;
            }
            return article.toJSON();
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        if (data.article_slug !== slug) {
            const frontendPath = `/articulos/${data.article_code}/${data.article_slug}`;

            // 1) Si el cliente acepta JSON (fetch/AJAX), devolvemos un 404 JSON
            if (req.accepts('json')) {
                return res.status(404).json({
                    status: 'error',
                    message: 'URL canónica diferente',
                    canonical: frontendPath
                });
            }

            // 2) Si el cliente acepta HTML (navegador), redirigimos a tu SPA
            const FRONT = process.env.FRONTEND_URL || 'http://192.168.1.6:5173';
            return res.redirect(301, FRONT + frontendPath);
        }


        // 2. LA MAGIA DEL SEO: Verificación de la URL Canónica
        // Si el slug de la URL no coincide con el slug actual en la base de datos,
        // hacemos una redirección permanente (301).
        
// 3. Si la URL es correcta, devolvemos la respuesta JSON como siempre.
res.set('Cache-Control', 'public, max-age=300, s-maxage=900');

res.status(200).json({
    status: 'success',
    article: data, // 'data' aquí es el objeto 'article' del caché/búsqueda
});

    } catch (error) {
    console.error('[Articles][GetById-Canonical]', error);
    res.status(500).json({
        status: 'error',
        message: 'Error al obtener el artículo.',
    });
}
};
*/