// middleware/transformImage.js
const sharp = require('sharp');

/**
 * Recibe req.file y genera un buffer optimizado:
 * - Resize máximo 800×800
 * - Formato WebP con calidad 80
 */
async function transformImage(req, res, next) {
  if (!req.file) return next();

  try {
    const optimized = await sharp(req.file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();

    // Reemplazamos el buffer original y cambiamos el mimetype/ext
    req.file.buffer = optimized;
    req.file.mimetype = 'image/webp';
    req.file.originalname = req.file.originalname.replace(/\.\w+$/, '.webp');
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = transformImage;
