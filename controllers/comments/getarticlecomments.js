// controllers/comments/getArticleComments.js
const CommentArticle = require('../../models/commentarticle');
const CommentVote = require('../../models/commentvote');
const User = require('../../models/user');
const { Sequelize } = require('sequelize');

module.exports = async (req, res) => {
    try {
        const articleId = req.params.articleId;

        // 1. Leemos el parámetro. El valor por defecto ahora es 'most-liked'.
        const sortBy = req.query.sort || 'most-liked';

        let order;
        // 2. AMPLIAMOS EL SWITCH CON LAS NUEVAS OPCIONES
        switch (sortBy) {
            case 'newest':
                order = [['created_at', 'DESC']];
                break;
            case 'oldest':
                order = [['created_at', 'ASC']];
                break;
            case 'most-replies':
                // Ordena por la cantidad de respuestas (hijos) que tiene cada comentario
                order = [[Sequelize.literal('(SELECT COUNT(*) FROM commentarticles AS replies WHERE replies.comment_parent_id = CommentArticle.comment_id)'), 'DESC']];
                break;
            case 'most-liked': // "Con más me gusta"
            default:
                // Ordena por la cantidad de votos positivos (upvotes)
                order = [[Sequelize.literal('(SELECT COUNT(*) FROM comment_votes WHERE comment_votes.comment_id = CommentArticle.comment_id AND comment_votes.vote_type = 1)'), 'DESC']];
                break;
        }

        const comments = await CommentArticle.findAll({
            attributes: [
                'comment_id',
                'comment_content',
                'comment_parent_id',
                'created_at'
            ],
            where: {
                comment_article_id: articleId,
                comment_is_approved: true,
                comment_parent_id: null
            },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['user_code', 'user_name', 'user_image']
                },
                {
                    model: CommentVote,
                    as: 'votes',
                    attributes: ['user_id', 'vote_type']
                },
                {
                    model: CommentArticle,
                    as: 'replies',
                    required: false,
                    include: [ // También traemos el autor y los votos de las respuestas
                        { model: User, as: 'author', attributes: ['user_code', 'user_name', 'user_lastname', 'user_image'] },
                        { model: CommentVote, as: 'votes', attributes: ['user_id', 'vote_type'] }
                    ]
                }
            ],
            order: order // Aplicamos el criterio de ordenación dinámico
        });

        return res.status(200).json({
            status: 'success',
            message: 'Comentarios obtenidos correctamente.',
            data: {
                comments: comments
            }
        });

    } catch (error) {
        console.error('[getArticleComments] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al obtener los comentarios.'
        })
    }

}