const sharp = require('sharp');

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const filename = `article-${Date.now()}.webp`;
        // middleware articles/sharparticleimage.js
        const buffer = await sharp(req.file.buffer)
            .resize({
                width: 1200,
                height: 630,
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .toBuffer();


        req.processedImage = {
            buffer,
            filename,
        };

        next();
    } catch (error) {
        console.error('[Sharp][ArticleImage]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al procesar la imagen.',
        });
    }
};
