// middleware/validateshort.js
const { check } = require('express-validator');

const validateShortCreate = [
    check('short_title')
        .optional() // porque allowNull: true en el modelo
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres'),

    check('short_slug')
        .notEmpty()
        .withMessage('El slug es obligatorio')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('El slug debe contener solo minúsculas, números y guiones')
        .isLength({ min: 3, max: 200 })
        .withMessage('El slug debe tener entre 3 y 200 caracteres'),

    check('short_duration')
        .notEmpty()
        .withMessage('La duración es obligatoria')
        .isInt({ min: 1 })
        .withMessage('La duración debe ser al menos 1 segundo'),

    check('short_video_url')
        .notEmpty()
        .withMessage('La URL del video es obligatoria'),

    check('short_author_id')
        .notEmpty()
        .withMessage('El autor es obligatorio')
        .isInt()
        .withMessage('El autor debe ser un número'),

    check('short_category_id')
        .notEmpty()
        .withMessage('La categoría es obligatoria')
        .isInt()
        .withMessage('La categoría debe ser un número'),

    check('short_is_published')
        .optional()
        .isBoolean()
        .withMessage('El estado de publicación debe ser booleano'),

    check('short_published_at')
        .optional()
        .isISO8601()
        .withMessage('La fecha de publicación debe ser una fecha válida'),
];

const validateShortUpdate = [
    check('short_title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres'),

    check('short_slug')
        .optional()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('El slug debe contener solo minúsculas, números y guiones')
        .isLength({ min: 3, max: 200 })
        .withMessage('El slug debe tener entre 3 y 200 caracteres'),


    check('short_video_url')
        .notEmpty()
        .withMessage('La URL del video es obligatoria'),

    check('short_author_id')
        .optional()
        .isInt()
        .withMessage('El autor debe ser un número'),

    check('short_category_id')
        .optional()
        .isInt()
        .withMessage('La categoría debe ser un número'),

    check('short_is_published')
        .optional()
        .isBoolean()
        .withMessage('El estado de publicación debe ser booleano'),

    check('short_published_at')
        .optional()
        .isISO8601()
        .withMessage('La fecha de publicación debe ser una fecha válida'),
];

module.exports = {
    validateShortCreate,
    validateShortUpdate,
};
