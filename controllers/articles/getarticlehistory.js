const { Op } = require('sequelize');
const ArticleLog = require('../../models/articlelog');
const User = require('../../models/user');
const Article = require('../../models/article');

const getArticleHistory = async (req, res) => {
  try {
    const { user_id, article_id, action, from, to, page = 1, limit = 10 } = req.query;

    const where = {};

    if (user_id) where.user_id = parseInt(user_id, 10);
    if (article_id) where.article_id = parseInt(article_id, 10);
    if (action) where.action = action; // espera 'create'|'update'|'delete'

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    const parsedLimit = Math.max(parseInt(limit), 1);
    const parsedPage = Math.max(parseInt(page), 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const logs = await ArticleLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['user_code', 'user_name', 'user_mail'] },
        { model: Article, as: 'article', attributes: ['article_code', 'article_title'] }
      ],
      limit: parsedLimit,
      offset,
      order: [['timestamp', 'DESC']]
    });

    return res.json({
      total: logs.count,
      page: parsedPage,
      totalPages: Math.ceil(logs.count / parsedLimit),
      logs: logs.rows
    });
  } catch (error) {
    console.error('Error al obtener historial de artículos:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = getArticleHistory;
