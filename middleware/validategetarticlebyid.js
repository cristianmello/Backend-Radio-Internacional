const { param, validationResult } = require('express-validator');

const validateGetArticleById = [
    param('id')
        .isInt().withMessage('El ID del artículo debe ser un número entero.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', errors: errors.array() });
        }
        next();
    }
];

module.exports = validateGetArticleById;
