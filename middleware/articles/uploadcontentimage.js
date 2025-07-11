const multer = require('multer');
const path = require('path');

// Reutilizamos la misma lógica de filtro de archivos que ya tienes
const storage = multer.memoryStorage();
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Formato inválido. Solo JPG, PNG o WebP.'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

module.exports = upload.single('file');