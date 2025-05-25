const multer = require('multer');
const storage = multer.memoryStorage();

module.exports = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
    }
});
