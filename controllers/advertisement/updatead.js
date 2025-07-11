const Advertisement = require('../../models/advertisement');
const AdvertisementLog = require('../../models/advertisement_log');
const { uploadToBunny, deleteFromBunny } = require('../../services/bunnystorage');
const redisClient = require('../../services/redisclient');

/**
 * Helper para limpiar claves de Redis usando un patrón.
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
    const { id } = req.params; // ID del anuncio a actualizar
    const t = await Advertisement.sequelize.transaction();


    try {
        // 1. Búsqueda y Validación de Existencia
        // Es crucial buscar el objeto dentro de la transacción para bloquear la fila.
        const ad = await Advertisement.findByPk(id, { transaction: t });

        if (!ad) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Anuncio no encontrado.' });
        }

        // Preparamos los datos
        const updateData = { ...req.body };
        const userId = req.user.id;
        const oldImageUrl = ad.ad_image_url; // Guardamos la URL antigua para posible eliminación

        // 2. Manejo de Reemplazo de Imágenes
        if (req.processedImage) {
            const { buffer, filename } = req.processedImage;

            // Subimos la nueva imagen a BunnyCDN
            const newImageUrl = await uploadToBunny(buffer, 'advertisements/', filename);
            updateData.ad_image_url = newImageUrl;

            // Si la subida fue exitosa y existía una imagen previa, la eliminamos.
            if (oldImageUrl) {
                // Hacemos esto de forma asíncrona y sin esperar (fire-and-forget).
                // No queremos que un fallo al borrar un archivo viejo impida la actualización.
                deleteFromBunny(oldImageUrl).catch(err => console.error(`[Bunny] Fallo al eliminar imagen antigua ${oldImageUrl}:`, err));
            }
        }

        // 3. Actualización del Anuncio en la Base de Datos
        // El método 'update' aplica los campos de 'updateData' al objeto 'ad'.
        await ad.update(updateData, { transaction: t });

        // 4. Creación del Registro de Auditoría (Log)
        await AdvertisementLog.create({
            user_id: userId,
            ad_id: ad.ad_id,
            action: 'update',
            details: JSON.stringify({ changes: updateData }) // Registramos los campos que se intentaron actualizar
        }, { transaction: t });

        // 5. Commit de la transacción
        await t.commit();

        // 6. Invalidación de Caché (Post-Commit)
        // Invalidamos tanto el caché del objeto específico como los de las listas.
        await redisClient.del(`advertisement:${id}`); // Limpieza de clave específica (más rápido que SCAN)
        await clearCacheByPattern('advertisements:*'); // Limpieza de listas de anuncios
        await clearCacheByPattern('sections:*');      // Limpieza de secciones por si el anuncio estaba ahí

        // 7. Respuesta Exitosa
        res.status(200).json({
            status: 'success',
            message: 'Anuncio actualizado exitosamente.',
            advertisement: ad // Devolvemos el objeto actualizado
        });

    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('[Ads][UpdateAd]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al actualizar el anuncio.'
        });
    }
};