// controllers/comments/deleteComment.js
const CommentArticle = require('../../models/commentarticle');
const CommentLog = require('../../models/commentlog');const { clearByPattern } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    const t = await CommentArticle.sequelize.transaction();

    try {
        const { comment } = req;
        const userId = req.user.id;

        const deletedContent = comment.comment_content;
        
        await CommentLog.create({
            user_id: userId,
            comment_id: comment.comment_id,
            action: 'delete',
            details: JSON.stringify({ deletedContent: deletedContent })
        }, { transaction: t });

        // Ejecutamos el Borrado Lógico (Soft Delete)
        await comment.destroy({ transaction: t });

        await t.commit();

        // 5. Invalidamos la caché
        await clearByPattern(`comments:article=${comment.comment_article_id}`);

        return res.status(200).json({
            status: 'success',
            message: 'Comentario eliminado correctamente.'
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error('[deleteComment] Error:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el comentario.'
        });
    }
};