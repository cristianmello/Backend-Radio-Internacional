const { check, body } = require('express-validator');
const AD_FORMATS = require('../../config/adformats');

module.exports = [
    // Validaciones de campo individuales (siguen siendo opcionales)
    check('ad_name').optional().trim().isLength({ min: 5, max: 150 }).withMessage('El nombre debe tener entre 5 y 150 caracteres.'),
    check('ad_type').optional().isIn(['image', 'script']).withMessage('El tipo debe ser "image" o "script".'),
    check('ad_format').optional().isIn(Object.keys(AD_FORMATS)).withMessage('Formato de anuncio inválido.'),
    check('ad_target_url').optional({ checkFalsy: true }).isURL().withMessage('La URL de destino debe ser válida.'),
    check('ad_is_active').optional().isBoolean().withMessage('El estado activo debe ser booleano.'),
    check('ad_start_date').optional({ checkFalsy: true }).isISO8601().toDate(),
    check('ad_end_date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // --- Validación de Coherencia a Nivel de Objeto ---
    body().custom((value, { req }) => {
        // req.ad existe gracias al middleware 'loadAd' que se ejecuta antes
        if (!req.ad) {
            // Esto no debería pasar si el loader funcionó, pero es una salvaguarda.
            throw new Error('No se pudo cargar el anuncio para validar la actualización.');
        }

        // 1. Creamos un objeto que representa el "estado final" del anuncio
        //    mezclando los datos existentes con los datos nuevos de la petición.
        const finalState = { ...req.ad.toJSON(), ...req.body };

        // 2. Aplicamos la misma lógica que en la creación, pero sobre el 'finalState'
        if (finalState.ad_type === 'image') {
            // Para ser un anuncio de imagen válido, debe tener una URL de destino Y
            // O bien se está subiendo un nuevo archivo (req.file) O ya tenía una URL de imagen.
            const hasImageUrl = finalState.ad_image_url || req.file;
            if (!hasImageUrl || !finalState.ad_target_url) {
                throw new Error('Un anuncio de tipo "imagen" debe tener una imagen y una URL de destino.');
            }
            if (!finalState.ad_format || !Object.keys(AD_FORMATS).includes(finalState.ad_format)) {
                throw new Error('Un anuncio de tipo "imagen" debe tener un formato válido.');
            }
        } else if (finalState.ad_type === 'script') {
            if (!finalState.ad_script_content) {
                throw new Error('Un anuncio de tipo "script" debe tener contenido de script.');
            }
        }

        // 3. Validamos las fechas
        if (finalState.ad_start_date && finalState.ad_end_date) {
            if (new Date(finalState.ad_end_date) < new Date(finalState.ad_start_date)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            }
        }

        return true; // Si todas las validaciones pasan
    }),
];