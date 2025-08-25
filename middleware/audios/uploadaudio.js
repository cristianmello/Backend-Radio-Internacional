/* middleware/audios/uploadAudio.js */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Guarda los archivos en la carpeta 'uploads/'
    },
    filename: (req, file, cb) => {
        // Genera un nombre único para evitar sobreescribir archivos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter
}).single('audio_file');