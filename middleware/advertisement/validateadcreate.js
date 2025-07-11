const { check, body } = require('express-validator');
const AD_FORMATS = require('../../config/adFormats');

module.exports = [
    check('ad_name')
        .trim()
        .notEmpty().withMessage('El nombre del anuncio es obligatorio.')
        .isLength({ min: 5, max: 150 }).withMessage('El nombre del anuncio debe tener entre 5 y 150 caracteres.'),

    check('ad_type')
        .isIn(['image', 'script']).withMessage('El tipo de anuncio debe ser "image" o "script".'),

    // --- Validaciones Condicionales Corregidas ---
    body().custom((value, { req }) => {
        const { ad_type, ad_target_url, ad_script_content, ad_format } = req.body;

        if (ad_type === 'image') {
            // CORRECCIÓN: En lugar de buscar la URL final (que no existe aún),
            // comprobamos si se ha subido un archivo (req.file) y si se ha proporcionado la URL de destino.
            if (!req.file || !ad_target_url) {
                throw new Error('Para anuncios de tipo "image", un archivo de imagen y la URL de destino son obligatorios.');
            }
            // si es imagen, el formato es obligatorio
            if (!ad_format || !Object.keys(AD_FORMATS).includes(ad_format)) {
                throw new Error('Debe seleccionar un formato de anuncio válido para el tipo "imagen".');
            }
        } else if (ad_type === 'script') {
            if (!ad_script_content) {
                throw new Error('Para anuncios de tipo "script", el contenido del script es obligatorio.');
            }
        }
        return true;
    }),

    // Estas validaciones de formato se ejecutan solo si los campos existen, lo cual es correcto.
    check('ad_target_url').optional({ checkFalsy: true }).isURL().withMessage('La URL de destino debe ser válida.'),

    check('ad_is_active').optional().isBoolean().withMessage('El estado activo debe ser un valor booleano (true/false).'),

    check('ad_start_date').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
    check('ad_end_date').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.')
        .custom((value, { req }) => {
            if (req.body.ad_start_date && new Date(value) < new Date(req.body.ad_start_date)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            }
            return true;
        }),
];