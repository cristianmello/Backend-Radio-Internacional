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
        const { parseBuffer } = await import('music-metadata');

        const meta = await parseBuffer(req.file.buffer, req.file.mimetype, { duration: true });
        durationSec = Math.floor(meta.format.duration);
    } catch (err) {
        console.warn('[processAudio] no se pudo leer duración:', err.message);
    }

    const inStream = new stream.PassThrough();
    inStream.end(req.file.buffer);

    // Parámetros de recodificación
    const targetCodec = 'libopus';      // u 'libmp3lame', 'aac'
    const targetExt = '.ogg';         // o '.mp3', '.m4a'
    const bitrate = '32k';          // '32k' o '64k'
    const sampleRate = 16000;          // 16 kHz

    const chunks = [];
    const outStream = new stream.PassThrough();

    ffmpeg(inStream)
        .audioCodec(targetCodec)
        .audioChannels(1)
        .audioFrequency(sampleRate)
        .audioBitrate(bitrate)
        .format(targetExt.replace('.', ''))  // 'ogg', 'mp3', 'm4a'
        .on('error', err => {
            console.error('[FFmpeg] fallo, guardando original:', err);
            // Fallback: buffer original y extensión original
            req.processedAudio = {
                buffer: req.file.buffer,
                filename: `audio-${Date.now()}${path.extname(req.file.originalname).toLowerCase()}`,
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
            duration: durationSec
        };
        next();
    });
};
