const { Op } = require('sequelize');
const ArticleLog = require('../../models/articlelog');
const User = require('../../models/user');
const Article = require('../../models/article');
const { Parser } = require('json2csv');

const getArticleHistoryCSV = async (req, res) => {
    try {
        const { user_id, article_id, action, from, to } = req.query;

        const where = {};

        if (user_id) where.user_id = parseInt(user_id, 10);
        if (article_id) where.article_id = parseInt(article_id, 10);
        if (action) where.action = action;

        if (from || to) {
            where.timestamp = {
                ...(from && { [Op.gte]: new Date(from) }),
                ...(to && { [Op.lte]: new Date(to) }),
            };
        }

        const logs = await ArticleLog.findAll({
            where,
            limit: 10000,
            include: [
                { model: User, as: 'user', attributes: ['user_name', 'user_mail'] },
                { model: Article, as: 'article', attributes: ['article_title'] }
            ],
            order: [['timestamp', 'DESC']]
        });

        if (!logs.length) {
            return res.status(404).json({ message: 'No se encontraron registros de historial de artículos' });
        }

        const mapped = logs.map(log => ({
            Usuario: `${log.user?.user_name || 'Desconocido'} (${log.user?.user_mail || 'N/A'})`,
            'Artículo': log.article?.article_title || 'N/A',
            Acción: log.action,
            Detalles: log.details || '',
            Fecha: log.timestamp.toLocaleString('es-AR'),
        }));

        const parser = new Parser();
        const csv = parser.parse(mapped);

        const today = new Date().toISOString().split('T')[0];
        const fileName = `historial-articulos-${today}.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);
    } catch (error) {
        console.error('Error al exportar CSV de historial de artículos:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el CSV' });
    }
};

module.exports = getArticleHistoryCSV;
