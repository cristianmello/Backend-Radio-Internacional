const sharp = require('sharp');

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const filename = `article-${Date.now()}.webp`;
        const buffer = await sharp(req.file.buffer)
            .resize(1200, 630)
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
