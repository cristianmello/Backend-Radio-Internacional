const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const cacheKey = 'categories:all';

  try {
    // Intentar obtener desde Redis
    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          status: 'success',
          source: 'cache',
          data: JSON.parse(cachedData)
        });
      }
    }

    // Si no hay en caché, consultar la DB
    const categories = await ArticleCategory.findAll({ order: [['category_name', 'ASC']] });

    // Guardar en Redis
    if (redisClient) {
      await redisClient.set(cacheKey, JSON.stringify(categories), 'EX', 3600); // TTL: 1h
    }

    return res.status(200).json({
      status: 'success',
      source: 'database',
      data: categories
    });
  } catch (err) {
    console.error('[Categories][GetAll]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener las categorías.'
    });
  }
};
