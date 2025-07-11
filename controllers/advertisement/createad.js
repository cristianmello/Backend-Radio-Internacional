const Advertisement = require('../../models/advertisement');
const AdvertisementLog = require('../../models/advertisement_log');
const { uploadToBunny } = require('../../services/bunnystorage');
const redisClient = require('../../services/redisclient');

/**
 * Helper para limpiar claves de Redis usando un patrón.
 * Extraído de tu lógica de artículos para consistencia.
 */
async function clearCacheByPattern(pattern) {
    let cursor = '0';
    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length) {
            await redisClient.del(...keys);
        }
        cursor = nextCursor;
    } while (cursor !== '0');
}

module.exports = async (req, res) => {
    // Usamos la instancia de Sequelize del modelo para asegurar la consistencia
    const t = await Advertisement.sequelize.transaction();


    try {
        // 1. Extracción de datos y usuario
        const adData = { ...req.body };
        const userId = req.user.id;

        // 2. Manejo de la imagen (si se subió una)
        // Esta lógica es idéntica a la que ya teníamos.
        if (req.processedImage) {
            const { buffer, filename } = req.processedImage;
            const imageUrl = await uploadToBunny(buffer, 'advertisements/', filename);
            adData.ad_image_url = imageUrl;
        }

        // 3. Creación del Anuncio
        // No hay validaciones de FK aquí porque el modelo Advertisement es autocontenido.
        const newAd = await Advertisement.create(adData, { transaction: t });

        // 4. Creación del Log de Auditoría
        // Se registra la acción dentro de la misma transacción.
        await AdvertisementLog.create({
            user_id: userId,
            ad_id: newAd.ad_id,
            action: 'create',
            details: JSON.stringify({ message: `Anuncio "${newAd.ad_name}" creado.` })
        }, { transaction: t });

        // 5. Commit de la transacción
        // Si todo lo anterior tuvo éxito, guardamos los cambios en la base de datos.
        await t.commit();


        await clearCacheByPattern('advertisements:*');
        await clearCacheByPattern('sections:*');

        // 7. Respuesta exitosa
        res.status(201).json({
            status: 'success',
            message: 'Anuncio creado exitosamente.',
            advertisement: newAd
        });

    } catch (error) {
        // Manejo de errores con rollback
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('[Ads][CreateAd]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al crear el anuncio.'
        });
    }
};