const { getOrSetCache } = require('../../services/cacheservice');
const Advertisement = require('../../models/advertisement');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        // Validación simple para asegurar que el ID es un número.
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ status: 'error', message: 'ID de anuncio inválido.' });
        }

        // Clave de caché específica para este anuncio.
        const cacheKey = `advertisement:${id}`;
        const EXPIRATION = 3600; // Cachear por 1 hora

        const ad = await getOrSetCache(cacheKey, async () => {
            // Búsqueda simple por clave primaria (PK).
            // No se necesitan 'includes' ya que el modelo Advertisement es autocontenido.
            const advertisement = await Advertisement.findByPk(id);
            return advertisement;
        }, EXPIRATION);

        if (!ad) {
            return res.status(404).json({
                status: 'error',
                message: 'Anuncio no encontrado.',
            });
        }

        // Establecemos cabeceras de caché para el navegador/CDN.
        res.set('Cache-Control', `public, max-age=${EXPIRATION}`);

        res.status(200).json({
            status: 'success',
            advertisement: ad
        });

    } catch (error) {
        console.error('[Ads][GetAdById]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el anuncio.',
        });
    }
};