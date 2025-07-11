// src/middleware/audios/validategetaudios.js
const { query } = require('express-validator');

const validateGetAudios = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page debe ser entero >= 1.'),
    query('limit')
        .optional()
        .isInt({ min: 1 }).withMessage('limit debe ser entero >= 1.'),
    query('category_id')
        .optional()
        .isInt().withMessage('category_id debe ser entero.'),
    query('category_slug')
        .optional()
        .isString().withMessage('category_slug debe ser texto.'),
    query('published')
        .optional()
        .isBoolean().withMessage('published debe ser booleano.'),
];

module.exports = validateGetAudios;