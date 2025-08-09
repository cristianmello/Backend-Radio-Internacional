// controllers/comments/updateComment.js
const CommentArticle = require('../../models/commentarticle');
const CommentLog = require('../../models/commentlog');const { clearByPattern } = require('../../services/cacheservice');

module.exports = async (req, res) => {

    const t = await CommentArticle.sequelize.transaction();

    try {
        const { comment } = req;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'El contenido para actualizar no puede estar vacío.'
            });
        }

        const originalContent = comment.comment_content;

        comment.comment_content = content;

        await comment.save({ transaction: t });

        await CommentLog.create({
            user_id: req.user.id,
            comment_id: comment.comment_id,
            action: 'update',
            details: JSON.stringify({ from: originalContent, to: content })
        }, { transaction: t });

        await t.commit();

        await clearByPattern(`comments:article=${comment.comment_article_id}`);

        return res.status(200).json({
            status: 'success',
            message: 'Comentario actualizado correctamente.',
            data: {
                comment
            }
        });

    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error('[updateComment] Error:', error)
        return res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el comentario.'
        });
    }
};