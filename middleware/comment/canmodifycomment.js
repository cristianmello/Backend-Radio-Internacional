// middleware/canModifyComment.js
const CommentArticle = require('../../models/commentarticle');

const canModifyComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { id: userId, roles } = req.user;

        // 1. Buscamos el comentario en la base de datos
        const comment = await CommentArticle.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({
                status: 'error',
                message: 'El comentario no fue encontrado.'
            });
        }

        // 2. Realizamos la comprobación de permisos
        const isOwner = comment.comment_user_id === userId;
        const isAdmin = roles.some(r => ['editor', 'admin', 'superadmin'].includes(r));

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Acceso denegado. No tienes permiso para realizar esta acción.'
            });
        }

        // Si el permiso es válido, adjuntamos el comentario encontrado
        // al objeto 'req'. Así el controlador no tiene que volver a buscarlo.
        req.comment = comment;

        next();

    } catch (error) {
        console.error('[canModifyComment] Error:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};

module.exports = canModifyComment;