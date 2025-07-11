
// src/middleware/audios/validategetaudiobyid.js
const { param } = require('express-validator');

const validateGetAudioById = [
    param('id')
        .exists().withMessage('El ID es obligatorio.')
        .isInt().withMessage('El ID debe ser un número entero.'),
];

module.exports = validateGetAudioById;