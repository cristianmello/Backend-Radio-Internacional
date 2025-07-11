// src/controllers/categories/getAllCategories.js

// src/controllers/categories/getAllCategories.js
const ArticleCategory = require('../../models/articlecategory');
// Importas tu helper en lugar de redisClient directamente
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res, next) => {
  try {
    const cacheKey = 'categories:all';

    // 1. Usamos el helper para obtener los datos
    const categories = await getOrSetCache(cacheKey, async () => {
      // Esta función solo se ejecuta si los datos no están en caché.
      // Su única responsabilidad es devolver los datos frescos de la DB.
      return ArticleCategory.findAll({
        order: [['category_code', 'ASC']],
      });
    }, 3600);

    // 2. Establecemos la cabecera para el caché del navegador
    res.set('Cache-Control', 'public, max-age=900, s-maxage=3600');

    // 3. Enviamos la respuesta
    return res.status(200).json({
      status: 'success',
      data: categories,
    });

  } catch (err) {
    console.error('[Categories][GetAll]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener las categorías.',
    });
  }
};

/*const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const cacheKey = 'categories:all';

  try {
    // 1. Intentar leer de Redis
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            status: 'success',
            source: 'cache',
            data: JSON.parse(cached),
          });
        }
      } catch (e) {
        console.warn('[Redis] Error al leer categories:all', e);
      }
    }

    // 2. Si miss, leer de la DB
    const categories = await ArticleCategory.findAll({
      order: [['category_code', 'ASC']],
    });

    // 3. Volver a cachear en Redis
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(categories), 'EX', 3600);
      } catch (e) {
        console.warn('[Redis] Error al escribir categories:all', e);
      }
    }

    return res.status(200).json({
      status: 'success',
      source: 'database',
      data: categories,
    });
  } catch (err) {
    console.error('[Categories][GetAll]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener las categorías.',
    });
  }
};
*/