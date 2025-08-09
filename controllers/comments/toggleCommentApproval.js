// controllers/comments/toggleCommentApproval.js

const { clearByPattern } = require('../../services/cacheservice');
const CommentArticle = require('../../models/commentarticle');
const CommentLog = require('../../models/commentlog');

module.exports = async (req, res) => {
    const t = await CommentArticle.sequelize.transaction();
    try {
        const { commentId } = req.params;

        const comment = await CommentArticle.findByPk(commentId);
        if (!comment) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Comentario no encontrado.' });
        }

        // 1. Cambiamos el estado de aprobación al opuesto
        comment.comment_is_approved = !comment.comment_is_approved;
        await comment.save({ transaction: t });

        // 2. Creamos un log para la acción de moderación
        await CommentLog.create({
            user_id: req.user.id, // El ID del admin que realiza la acción
            comment_id: comment.comment_id,
            action: comment.comment_is_approved ? 'approve' : 'unapprove', // Acción más específica
            details: `Estado cambiado a: ${comment.comment_is_approved}`
        }, { transaction: t });

        await t.commit();

        // 3. Limpiamos la caché del artículo para que el cambio se refleje
        await clearByPattern(`comments:article=${comment.comment_article_id}`);

        return res.status(200).json({
            status: 'success',
            message: 'Estado del comentario actualizado.',
            data: {
                comment // Devolvemos el comentario actualizado
            }
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[toggleCommentApproval] Error:', error);
        return res.status(500).json({ status: 'error', message: 'Error al moderar el comentario.' });
    }
};