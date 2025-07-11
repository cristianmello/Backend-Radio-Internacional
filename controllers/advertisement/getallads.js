const { getOrSetCache } = require('../../services/cacheservice');
const Advertisement = require('../../models/advertisement');
const { Op } = require('sequelize'); // Importamos Op para filtros más complejos

module.exports = async (req, res) => {
    try {
        // 1. Opciones de consulta con valores por defecto
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'created_at';
        const order = req.query.order || 'DESC';
        const { type, active, search } = req.query;

        // 2. Construcción de la cláusula 'where' para los filtros
        const whereClause = {};
        if (active) {
            whereClause.ad_is_active = active === 'true';
        }
        if (type) {
            whereClause.ad_type = type;
        }
        if (search) {
            whereClause.ad_name = { [Op.like]: `%${search}%` };
        }

        // 3. Creación de una clave de caché dinámica basada en los filtros
        const cacheKey = `advertisements:all:page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}&type=${type || ''}&active=${active || ''}&search=${search || ''}`;
        const EXPIRATION = 300; // Cachear listas por 5 minutos

        const results = await getOrSetCache(cacheKey, async () => {
            // 4. Búsqueda y conteo para paginación
            const data = await Advertisement.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [[sortBy, order]]
            });
            return data;
        }, EXPIRATION);

        // 5. Formateo de la respuesta con metadatos de paginación
        const totalPages = Math.ceil(results.count / limit);

        res.status(200).json({
            status: 'success',
            pagination: {
                totalItems: results.count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            },
            advertisements: results.rows
        });

    } catch (error) {
        console.error('[Ads][GetAllAds]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la lista de anuncios.'
        });
    }
};