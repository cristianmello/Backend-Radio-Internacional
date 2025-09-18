const { Op } = require('sequelize');
const ShortLog = require('../../models/shortlog');
const User = require('../../models/user');
const Short = require('../../models/short');
const ArticleCategory = require('../../models/articlecategory');
const { Parser } = require('json2csv');

const getShortHistoryCSV = async (req, res) => {
    try {
        const { user_id, short_id, action, from, to } = req.query;

        // Construir filtros
        const where = {};
        if (user_id) where.user_id = parseInt(user_id, 10);
        if (short_id) where.short_id = parseInt(short_id, 10);
        if (action) where.action = action;

        if (from || to) {
            where.timestamp = {
                ...(from && { [Op.gte]: new Date(from) }),
                ...(to && { [Op.lte]: new Date(to) })
            };
        }

        // Obtener logs con category incluido
        const logs = await ShortLog.findAll({
            where,
            limit: 10000,
            include: [
                { model: User, as: 'user', attributes: ['user_name', 'user_mail'] },
                {
                    model: Short,
                    as: 'short',
                    attributes: ['short_title'],
                    include: [
                        {
                            model: ArticleCategory,
                            as: 'category',
                            attributes: ['category_name']
                        }
                    ]
                }
            ],
            order: [['timestamp', 'DESC']]
        });

        if (!logs.length) {
            return res.status(404).json({
                message: 'No se encontraron registros de historial de shorts'
            });
        }

        // Mapear para CSV incluyendo categoría
        const mapped = logs.map(log => ({
            Usuario: `${log.user?.user_name || 'Desconocido'} (${log.user?.user_mail || 'N/A'})`,
            Short: log.short?.short_title || 'N/A',
            Categoría: log.short?.category?.category_name || 'N/A',
            Acción: log.action,
            Detalles: log.details || '',
            Fecha: log.timestamp.toLocaleString('es-UY')
        }));

        // Generar CSV
        const parser = new Parser();
        const csv = parser.parse(mapped);

        // Preparar nombre de archivo
        const today = new Date().toISOString().split('T')[0];
        const fileName = `historial-shorts-${today}.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);

    } catch (error) {
        console.error('[ShortsHistoryCSV][Error]', error);
        return res.status(500).json({
            message: 'Error interno del servidor al generar el CSV'
        });
    }
};

module.exports = getShortHistoryCSV;
