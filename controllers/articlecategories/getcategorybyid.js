// src/controllers/categories/getCategoryById.js
const ArticleCategory = require('../../models/articlecategory');
// 1. Importar el helper en lugar de redisClient directamente
const { getOrSetCache } = require('../../services/cacheservice');

module.exports = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 2. Validar el ID (esta parte de tu código original estaba perfecta)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'ID de categoría inválido.',
      });
    }

    const cacheKey = `category:${id}`;

    // 3. Usar el helper para obtener la categoría
    const category = await getOrSetCache(cacheKey, async () => {
      // Esta función solo se ejecuta si la categoría no está en caché
      return ArticleCategory.findByPk(id);
    }, 3600); // Expiración de 1 hora

    // 4. Manejar el caso "No encontrado" de forma limpia
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Categoría no encontrada.',
      });
    }

    // 5. Si se encontró, establecer cabecera y enviar la respuesta
    // Como una categoría es muy estática, le damos un caché largo.
    res.set('Cache-Control', 'public, max-age=900, s-maxage=3600');

    return res.status(200).json({
      status: 'success',
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

/*const ArticleCategory = require('../../models/articlecategory');
const redisClient = require('../../services/redisclient');

module.exports = async (req, res, next) => {
  const { id } = req.params;
  let responseData; // Variable para guardar los datos

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
        responseData = JSON.parse(cached);

        return res.status(200).json({
          status: 'success',
          source: 'cache',
          data: JSON.parse(cached),
        });
      }
    }
    if (!responseData) {
      const categories = await ArticleCategory.findAll({
        order: [['category_code', 'ASC']],
      });
      responseData = categories; // Guardamos los datos de la DB

      if (redisClient) {
        // Usamos .catch() para no bloquear la respuesta si Redis falla
        redisClient.set(cacheKey, JSON.stringify(categories), 'EX', 3600)
          .catch(e => console.warn('[Redis] Error al escribir categories:all', e));
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

    res.set('Cache-Control', 'public, max-age=900, s-maxage=3600');

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
*/