const sharp = require('sharp');
const AD_FORMATS = require('../../config/adformats'); // Importamos nuestra configuración

module.exports = async (req, res, next) => {
    // Si no se subió ningún archivo, simplemente continuamos.
    if (!req.file) return next();

    try {
        // 1. Leemos el formato del anuncio desde el cuerpo de la petición.
        //    Si no viene, usamos 'default'.
        const formatKey = req.body.ad_format || 'default';

        // 2. Buscamos las dimensiones en nuestra configuración.
        //    Si el formato no es válido, usamos 'default'.
        const dimensions = AD_FORMATS[formatKey] || AD_FORMATS['default'];

        // 3. Creamos un nombre de archivo único.
        const filename = `ad-${formatKey}-${Date.now()}.webp`;

        // 4. Procesamos la imagen con Sharp usando las dimensiones dinámicas.
        const buffer = await sharp(req.file.buffer)
            .resize({
                width: dimensions.width,
                height: dimensions.height,
                // 'cover' es ideal para anuncios: llena el espacio y recorta el exceso.
                // 'inside' asegura que toda la imagen entre, pero puede dejar barras de color.
                fit: dimensions.fit
            })
            .webp({ quality: 85 }) // Calidad ligeramente mayor para anuncios
            .toBuffer();

        // 5. Adjuntamos la imagen procesada al objeto 'req' para el siguiente middleware/controlador.
        req.processedImage = {
            buffer,
            filename,
        };

        next();
    } catch (error) {
        console.error('[Sharp][AdImage]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al procesar la imagen del anuncio.',
        });
    }
};