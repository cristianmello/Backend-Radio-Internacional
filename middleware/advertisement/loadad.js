const Advertisement = require('../../models/advertisement');

/**
 * Middleware para cargar un anuncio por su ID y adjuntarlo a req.ad.
 * Si no se encuentra, devuelve un error 404.
 */
module.exports = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!/^\d+$/.test(id)) {
            return res.status(404).json({ status: 'error', message: 'Anuncio no encontrado.' });
        }

        const ad = await Advertisement.findByPk(id);

        if (!ad) {
            return res.status(404).json({ status: 'error', message: 'Anuncio no encontrado.' });
        }

        // Adjuntamos el anuncio encontrado al objeto de la petición
        req.ad = ad;
        next(); // Continuamos al siguiente middleware (el validador)

    } catch (error) {
        console.error('[Middleware][loadAd]', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};