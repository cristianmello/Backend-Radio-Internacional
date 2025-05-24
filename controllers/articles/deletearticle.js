const Article = require('../../models/article');

module.exports = async (req, res) => {
    const t = await Article.sequelize.transaction();
    try {
        const { id } = req.params;

        const article = await Article.findByPk(id);
        if (!article) {
            await t.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Artículo no encontrado.',
            });
        }

        await article.destroy({ transaction: t });
        await t.commit();
        await redisClient.del(`article:${id}`);
        await redisClient.keys('articles:*').then(keys => keys.forEach(k => redisClient.del(k)));

        res.status(200).json({
            status: 'success',
            message: 'Artículo eliminado correctamente.',
        });
    } catch (error) {
        await t.rollback();
        console.error('[Articles][Delete]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar el artículo.',
        });
    }
};
