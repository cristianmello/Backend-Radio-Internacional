// controllers/comments/voteOnComment.js
const CommentArticle = require('../../models/commentarticle');
const CommentVote = require('../../models/commentvote');

module.exports = async (req, res) => {
    const t = await CommentVote.sequelize.transaction();
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        // La dirección del voto viene en el cuerpo: 1 para 'up', -1 para 'down'
        const { direction } = req.body;

        if (![1, -1].includes(direction)) {
            return res.status(400).json({ status: 'error', message: 'Dirección de voto inválida.' });
        }

        const comment = await CommentArticle.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ status: 'error', message: 'Comentario no encontrado.' });
        }

        // Buscamos si ya existe un voto del usuario en este comentario
        const existingVote = await CommentVote.findOne({ where: { comment_id: commentId, user_id: userId } });

        if (existingVote) {
            // Si el usuario vota en la misma dirección, es para quitar el voto
            if (existingVote.vote_type === direction) {
                await existingVote.destroy({ transaction: t });
            } else { // Si vota en dirección opuesta, se cambia el voto
                existingVote.vote_type = direction;
                await existingVote.save({ transaction: t });
            }
        } else {
            // Si no hay voto existente, se crea uno nuevo
            await CommentVote.create({
                comment_id: commentId,
                user_id: userId,
                vote_type: direction
            }, { transaction: t });
        }

        await t.commit();

        const upvotes = await CommentVote.count({ where: { comment_id: commentId, vote_type: 1 } });
        const downvotes = await CommentVote.count({ where: { comment_id: commentId, vote_type: -1 } });

        return res.status(200).json({
            status: 'success',
            message: 'Voto registrado correctamente.',
            data: {
                upvotes,
                downvotes
            }
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[voteOnComment] Error:', error);
        return res.status(500).json({ status: 'error', message: 'Error al procesar el voto.' });
    }
};