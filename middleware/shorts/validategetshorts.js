const { query, validationResult } = require('express-validator');

const validateGetShorts = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 }) // límite reducido por ser contenido pesado (videos)
        .withMessage('El límite debe ser un número entre 1 y 20.'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo.'),

    query('category_id')
        .optional()
        .isInt()
        .withMessage('El ID de categoría debe ser un número entero.'),

    query('published')
        .optional()
        .isBoolean()
        .withMessage('El valor de "published" debe ser true o false.'),

    query('author_id')
        .optional()
        .isInt()
        .withMessage('El ID del autor debe ser un número entero.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', errors: errors.array() });
        }
        next();
    }
];

module.exports = validateGetShorts;
