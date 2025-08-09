// controllers/users/getUserProfileSummary.js

const CommentArticle = require('../../models/commentarticle');
const CommentVote = require('../../models/commentvote');
const User = require('../../models/user');
const Article = require('../../models/article');

module.exports = async (req, res) => {
    try {
        const { user_code } = req.params;

        // 1. Buscamos al usuario
        const user = await User.findByPk(user_code, {
            attributes: ['user_code', 'user_name', 'user_lastname', 'user_image']
        });

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        // 2. Usamos Promise.all para hacer las búsquedas en paralelo
        const [commentCount, likesReceivedCount, recentComments] = await Promise.all([
            // Contar todos los comentarios del usuario
            CommentArticle.count({ where: { comment_user_id: user_code } }),

            // Contar todos los "me gusta" que han recibido los comentarios de este usuario
            CommentVote.count({
                where: { vote_type: 1 },
                include: [{
                    model: CommentArticle,
                    required: true,
                    where: { comment_user_id: user_code },
                    attributes: []
                }]
            }),

            // Obtener los 5 comentarios más recientes
            CommentArticle.findAll({
                attributes: [
                    'comment_id',
                    'comment_content',
                    'created_at'
                ],
                where: { comment_user_id: user_code },
                limit: 5,
                order: [['created_at', 'DESC']],
                include: [{ // Incluimos el artículo para poder enlazarlo
                    model: Article,
                    as: 'article',
                    attributes: ['article_code', 'article_title', 'article_slug']
                }]
            })
        ]);

        // Nota sobre los 'Seguidores': Tu base de datos actual no tiene un sistema para seguir usuarios.
        // Por ahora, devolveremos 0. Implementarlo requeriría una nueva tabla 'Followers'.

        return res.status(200).json({
            status: 'success',
            data: {
                user,
                stats: {
                    comments: commentCount,
                    likesReceived: likesReceivedCount,
                    followers: 0 // Placeholder
                },
                recentComments
            }
        });

    } catch (error) {
        console.error('[GetUserProfileSummary] Error:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};