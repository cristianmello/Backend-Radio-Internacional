// src/middleware/sections/validateSection.js
const { check, param, body } = require('express-validator');

/**
 * Valida POST /api/sections
 * - section_title: string no vacío
 * - section_type: uno de los tipos permitidos
 */
const validateCreateSection = [
    body('section_title')
        .optional()
        .trim()
        .isLength({ min: 3 }).withMessage('El título debe tener al menos 3 caracteres.')
        .isLength({ max: 200 }).withMessage('El título no puede exceder 200 caracteres.'),
    body('section_type')
        .isIn([
            'breaking', 'maincontent', 'trending', 'sidebar', 'featured', 'world',
            'mosaic', 'video', 'shorts', 'popular', 'newsletter',
            'ad-large', 'ad-biglarge', 'ad-small', 'ad-verticalsm', 'ad-banner', ,
            'ad-skyscraper', 'tags', 'gallery', 'weather'
        ]).withMessage('Tipo de sección inválido.'),
];


/**
 * Valida GET /api/sections/:slug
 * - slug: string alfanumérico y guiones
 */
const validateGetSection = [
    param('slug')
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug de sección inválido.'),
];

/**
 * Valida POST /api/sections/:slug      (añadir ítem)
 * - slug: validado arriba
 * - code: número entero > 0
 */
const validateAddItem = [
    ...validateGetSection,
    body('code')
        .notEmpty().withMessage('Debe enviar el código del ítem.')
        .isInt({ gt: 0 }).withMessage('El código debe ser un entero positivo.'),
];

/**
 * Valida DELETE /api/sections/:slug/:code  (quitar ítem)
 * - slug: validado arriba
 * - code: número entero > 0
 */
const validateRemoveItem = [
    ...validateGetSection,
    param('code')
        .isInt({ gt: 0 }).withMessage('El código debe ser un entero positivo.'),
];

/**
 * Valida PUT /api/sections/:slug/reorder
 * - slug: validado arriba
 * - orderedCodes: array de enteros >0
 */
const validateReorder = [
    ...validateGetSection,
    body('orderedCodes')
        .isArray({ min: 1 }).withMessage('Debe enviar orderedCodes como array no vacío.'),
    body('orderedCodes.*')
        .isInt({ gt: 0 }).withMessage('Cada código debe ser un entero positivo.'),
];

module.exports = {
    validateCreateSection,
    validateGetSection,
    validateAddItem,
    validateRemoveItem,
    validateReorder
};
