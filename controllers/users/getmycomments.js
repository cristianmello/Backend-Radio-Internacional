// controllers/users/getMyComments.js

const CommentArticle = require('../../models/commentarticle');
const Article = require('../../models/article');

module.exports = async (req, res) => {
    try {
        const userId = req.user.id; // Obtenemos el ID del usuario del token

        // Implementamos paginación, como en los otros controladores de listas
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { rows: comments, count: total } = await CommentArticle.findAndCountAll({
            where: {
                comment_user_id: userId
            },
            // Incluimos el artículo para saber dónde se hizo el comentario
            include: [{
                model: Article,
                as: 'article',
                attributes: ['article_code', 'article_title', 'article_slug']
            }],
            order: [['created_at', 'DESC']], // Mostramos los más recientes primero
            limit,
            offset
        });

        return res.status(200).json({
            status: 'success',
            message: 'Comentarios del usuario obtenidos correctamente.',
            data: {
                total,
                page,
                limit,
                comments
            }
        });

    } catch (error) {
        console.error('[getMyComments] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener los comentarios del usuario.'
        });
    }
};