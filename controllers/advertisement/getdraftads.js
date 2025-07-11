const { getOrSetCache } = require('../../services/cacheservice');
const Advertisement = require('../../models/advertisement');
const { Op } = require('sequelize');

module.exports = async (req, res) => {
    try {
        // Opciones de consulta para paginación y ordenamiento, igual que en GetAllAds
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'updated_at'; // Ordenamos por actualización para ver los borradores más recientes
        const order = req.query.order || 'DESC';

        // La diferencia clave: el where clause está fijo
        const whereClause = {
            ad_is_active: false
        };

        // Clave de caché específica para los borradores
        const cacheKey = `advertisements:drafts:page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`;
        const EXPIRATION = 60;

        const results = await getOrSetCache(cacheKey, async () => {
            const data = await Advertisement.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [[sortBy, order]]
            });
            return data;
        }, EXPIRATION);

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
        console.error('[Ads][GetDraftAds]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la lista de borradores de anuncios.'
        });
    }
};