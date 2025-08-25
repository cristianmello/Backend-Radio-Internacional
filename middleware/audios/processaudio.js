// src/middleware/audios/processAudio.js
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    let durationSec = null;
    try {
        const mm = await import('music-metadata');

        const metadata = await mm.parseFile(req.file.path);
        durationSec = Math.floor(metadata.format.duration);
    } catch (err) {
        console.warn('[processAudio] no se pudo leer duración:', err.message);
    }

    // Parámetros de recodificación
    const targetCodec = 'libopus';      // u 'libmp3lame', 'aac'
    const targetExt = '.ogg';         // o '.mp3', '.m4a'
    const bitrate = '32k';          // '32k' o '64k'
    const sampleRate = 16000;          // 16 kHz

    const chunks = [];
    const outStream = new stream.PassThrough();

    ffmpeg(req.file.path)
        .audioCodec(targetCodec)
        .audioChannels(1)
        .audioFrequency(sampleRate)
        .audioBitrate(bitrate)
        .format(targetExt.replace('.', ''))  // 'ogg', 'mp3', 'm4a'
        .on('error', err => {
            console.error('[FFmpeg] fallo, guardando original:', err);
            // Fallback: buffer original y extensión original
            req.processedAudio = {
                filename: `audio-${Date.now()}${path.extname(req.file.originalname).toLowerCase()}`,
                originalPath: req.file.path,
                isFallback: true,
                duration: durationSec
            };
            next();
        })
        .pipe(outStream, { end: true });

    outStream.on('data', chunk => chunks.push(chunk));
    outStream.on('end', () => {
        req.processedAudio = {
            buffer: Buffer.concat(chunks),
            filename: `audio-${Date.now()}${targetExt}`,
            duration: durationSec,
            originalPath: req.file.path
        };
        next();
    });
};
