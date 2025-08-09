// controllers/comments/createComment.js
const CommentArticle = require('../../models/commentarticle');
const User = require('../../models/user');
const Article = require('../../models/article');
const CommentLog = require('../../models/commentlog');
const { clearByPattern } = require('../../services/cacheservice');

module.exports = async (req, res) => {
    // Iniciamos la transacción, como en tu controlador createArticle
    const t = await CommentArticle.sequelize.transaction();
    try {
        const { content, parentId } = req.body;
        const { articleId } = req.params;

        const userId = req.user.id;

        // Verificamos que el artículo exista antes de comentar
        const articleExists = await Article.findByPk(articleId);
        if (!articleExists) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'El artículo en el que intentas comentar no existe.',
            });
        }

        // Creamos el comentario
        const newComment = await CommentArticle.create({
            comment_content: content,
            comment_article_id: articleId,
            comment_user_id: userId,
            comment_parent_id: parentId || null
        }, { transaction: t });

        await CommentLog.create({
            user_id: userId,
            comment_id: newComment.comment_id,
            action: 'create',
            details: JSON.stringify({ content: newComment.comment_content })
        }, { transaction: t });

        // Finalizamos la transacción
        await t.commit();

        await clearByPattern(`comments:article=${articleId}`);

        // Devolvemos el comentario creado, incluyendo los datos del autor para el frontend
        const commentWithAuthor = await CommentArticle.findByPk(newComment.comment_id, {
            include: {
                model: User,
                as: 'author',
                attributes: ['user_code', 'user_name', 'user_image']
            }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Comentario creado correctamente.',
            data: {
                comment: commentWithAuthor
            }
        });

    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error('[createComment] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al crear el comentario.',
        });
    }
};