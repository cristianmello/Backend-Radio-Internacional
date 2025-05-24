const { check } = require('express-validator');

// Middleware para validar datos al actualizar un artículo
const validateArticleUpdate = [
    check('article_title')
        .optional()
        .notEmpty().withMessage('El título no puede estar vacío')
        .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres'),

    check('article_slug')
        .optional()
        .notEmpty().withMessage('El identificador para la URL no puede estar vacío')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('El identificador debe estar en minúsculas y solo puede contener letras, números y guiones (ej: mi-articulo)'),

    check('article_content')
        .optional()
        .notEmpty().withMessage('El contenido del artículo no puede estar vacío')
        .isLength({ min: 10 }).withMessage('El contenido debe tener al menos 10 caracteres'),

    check('article_image_url')
        .optional({ nullable: true })
        .isURL().withMessage('La URL de la imagen no es válida'),

    check('article_author_id')
        .optional()
        .isInt().withMessage('El autor seleccionado no es válido'),

    check('article_category_id')
        .optional()
        .isInt().withMessage('La categoría seleccionada no es válida'),

    check('article_published_at')
        .optional({ nullable: true })
        .isISO8601().withMessage('La fecha de publicación debe tener un formato válido (YYYY-MM-DD)'),

    check('article_is_published')
        .optional()
        .isBoolean().withMessage('El estado de publicación debe ser verdadero o falso'),

    check('article_is_premium')
        .optional()
        .isBoolean().withMessage('El estado de premium debe ser verdadero o falso'),
];

module.exports = validateArticleUpdate;
