/* middleware/audios/uploadAudio.js */
const multer = require('multer');
const path = require('path');

// Usamos memoryStorage para procesar el buffer y luego subirlo
const storage = multer.memoryStorage();

const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',

];
const allowedExts = ['.mp3', '.wav', '.ogg', '.webm', '.m4a'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
        return cb(new Error('Formato inválido. Solo MP3, WAV, OGG o WEBM.'), false);
    }
    cb(null, true);
};

module.exports = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter
}).single('audio_file');