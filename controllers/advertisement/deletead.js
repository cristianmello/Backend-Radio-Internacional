const Advertisement = require('../../models/advertisement');
const AdvertisementLog = require('../../models/advertisement_log');
const { deleteFromBunny } = require('../../services/bunnystorage');
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
    const { id } = req.params; // ID del anuncio a eliminar
    const t = await Advertisement.sequelize.transaction();


    try {
        // 1. Búsqueda y Validación de Existencia
        const ad = await Advertisement.findByPk(id);

        if (!ad) {
            // No es necesario un rollback si no se encontró nada que empezar a transaccionar
            return res.status(404).json({ status: 'error', message: 'Anuncio no encontrado.' });
        }

        // 2. Guardar información necesaria ANTES de borrar
        const imageUrlToDelete = ad.ad_image_url;
        const adNameToLog = ad.ad_name;
        const userId = req.user.id;

        // 3. Creación del Registro de Auditoría (Log)
        // Lo creamos antes de borrar para tener un registro de la intención.
        await AdvertisementLog.create({
            user_id: userId,
            ad_id: id,
            action: 'delete',
            details: JSON.stringify({ message: `Anuncio "${adNameToLog}" eliminado.` })
        }, { transaction: t });


        // 5. Eliminación del Anuncio de la base de datos
        await ad.destroy({ transaction: t });

        // 6. Si todo en la BD fue exitoso, confirmamos la transacción
        await t.commit();

        // 7. Limpieza de Recursos Externos (Post-Commit)
        // Una vez confirmada la transacción, borramos la imagen de BunnyCDN.
        if (imageUrlToDelete) {
            deleteFromBunny(imageUrlToDelete).catch(err => console.error(`[Bunny] Fallo al eliminar imagen huérfana ${imageUrlToDelete}:`, err));
        }

        // 8. Invalidación de Caché (Post-Commit)
        await redisClient.del(`advertisement:${id}`);
        await clearCacheByPattern('advertisements:*');
        await clearCacheByPattern('sections:*');

        // 9. Respuesta Exitosa
        res.status(200).json({
            status: 'success',
            message: 'Anuncio eliminado exitosamente.'
        });

    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('[Ads][DeleteAd]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor al eliminar el anuncio.'
        });
    }
};