const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      status: 'error',
      message: 'ID de categoría inválido.',
    });
  }

  const cacheKey = `category:${id}`;

  try {
    // Intentar obtener desde Redis
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          status: 'success',
          source: 'cache',
          data: JSON.parse(cached),
        });
      }
    }

    // Buscar en la base de datos
    const category = await ArticleCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada.',
      });
    }

    // Guardar en Redis
    if (redisClient) {
      await redisClient.set(cacheKey, JSON.stringify(category), 'EX', 3600); // 1 hora
    }

    return res.status(200).json({
      status: 'success',
      source: 'database',
      data: category,
    });
  } catch (err) {
    console.error('[Categories][GetById]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener la categoría.',
    });
  }
};
