const { getOrSetCache } = require('../../services/cacheservice');
const Short = require('../../models/short');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory'); // agregado

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID inválido.',
            });
        }

        const cacheKey = `short:${id}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const short = await Short.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname'],
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        attributes: ['category_code', 'category_name'],
                    }
                ],
            });

            if (!short) {
                return null;
            }

            return {
                status: 'success',
                short,
            };
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Short no encontrado.',
            });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('[Shorts][GetById]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el short.',
        });
    }
};
