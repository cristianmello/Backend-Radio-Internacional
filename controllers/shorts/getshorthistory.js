const { Op } = require('sequelize');
const ShortLog = require('../../models/shortlog');
const User = require('../../models/user');
const Short = require('../../models/short');
const ArticleCategory = require('../../models/articlecategory'); // agregado

const getShortHistory = async (req, res) => {
    try {
        // Extraer filtros de query params
        const {
            user_id,
            short_id,
            action,
            from,
            to,
            page = 1,
            limit = 10
        } = req.query;

        // Construir objeto where dinámico
        const where = {};
        if (user_id) where.user_id = parseInt(user_id, 10);
        if (short_id) where.short_id = parseInt(short_id, 10);
        if (action) where.action = action; // 'create'|'update'|'delete'

        // Rango de fechas
        if (from || to) {
            where.timestamp = {};
            if (from) where.timestamp[Op.gte] = new Date(from);
            if (to) where.timestamp[Op.lte] = new Date(to);
        }

        // Paginación
        const parsedLimit = Math.max(parseInt(limit, 10), 1);
        const parsedPage = Math.max(parseInt(page, 10), 1);
        const offset = (parsedPage - 1) * parsedLimit;

        // Query con conteo total
        const result = await ShortLog.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_code', 'user_name', 'user_mail']
                },
                {
                    model: Short,
                    as: 'short',
                    attributes: ['short_code', 'short_title'],
                    include: [
                        {
                            model: ArticleCategory,
                            as: 'category',
                            attributes: ['category_code', 'category_name'],
                        }
                    ]
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: parsedLimit,
            offset: offset
        });

        // Responder con meta y datos
        return res.json({
            total: result.count,
            page: parsedPage,
            totalPages: Math.ceil(result.count / parsedLimit),
            logs: result.rows
        });
    } catch (error) {
        console.error('[ShortsHistory][Get]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener el historial de shorts.'
        });
    }
};

module.exports = getShortHistory;
