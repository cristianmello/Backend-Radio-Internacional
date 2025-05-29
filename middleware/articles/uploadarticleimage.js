const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
        return cb(
            new Error('Formato inválido. Solo se permiten imágenes JPG, PNG o WebP.'),
            false
        );
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

module.exports = upload.single('image');
