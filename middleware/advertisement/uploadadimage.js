const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Siempre en memoria para procesar con Sharp

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Formato de imagen inválido. Solo se permiten JPG, PNG, WebP o GIF.'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// En el formulario, este campo se llamará 'ad_image_file'.
// El campo 'ad_image_url' del modelo se llenará en el controlador con la URL final.
module.exports = upload.single('ad_image_file');