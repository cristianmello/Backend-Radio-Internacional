const multer = require('multer');
const path = require('path');

// Usamos memoryStorage para procesar buffer con sharp y luego subir
const storage = multer.memoryStorage();

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
        return cb(new Error('Formato inválido. Solo JPG, PNG o WebP.'), false);
    }
    cb(null, true);
};

// Cambiamos el campo a 'article_image_url' para coincidir con el nombre en el controlador
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

// Exportamos el middleware para un solo archivo bajo el campo 'article_image_url'
module.exports = upload.single('article_image_url');

