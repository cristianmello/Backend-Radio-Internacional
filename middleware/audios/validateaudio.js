// src/middleware/audios/validateaudio.js
const { body, param } = require('express-validator');

// Reglas de validación para creación de audio
const validateAudioCreate = [
  body('audio_title')
    .exists().withMessage('El título es obligatorio.')
    .isString().withMessage('El título debe ser un texto.')
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),
  body('audio_slug')
    .exists().withMessage('El slug es obligatorio.')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('El slug solo puede tener letras, números y guiones.')
    .isLength({ min: 5, max: 200 }).withMessage('El slug debe tener entre 5 y 200 caracteres.'),
  // audio_url puede venir en body o como archivo procesado
  body('audio_url')
    .optional({ nullable: true })
    .isURL().withMessage('La URL del audio debe ser válida.'),
  body('audio_author_id')
    .exists().withMessage('El ID de autor es obligatorio.')
    .isInt().withMessage('El ID de autor debe ser un entero.'),
  body('audio_category_id')
    .exists().withMessage('El ID de categoría es obligatorio.')
    .isInt().withMessage('El ID de categoría debe ser un entero.'),
  body('audio_published_at')
    .optional({ nullable: true })
    .isISO8601().withMessage('La fecha de publicación debe ser una fecha válida.'),
  body('audio_is_published')
    .optional()
    .isBoolean().withMessage('audio_is_published debe ser booleano.'),
];

// Reglas para actualización: igual que creación, salvo que todos los campos son opcionales
const validateAudioUpdate = [
  param('id')
    .exists().withMessage('El ID es obligatorio.')
    .isInt().withMessage('El ID debe ser numérico.'),
  body('audio_title')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres.'),
  body('audio_slug')
    .optional()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('El slug solo puede tener letras, números y guiones.')
    .isLength({ min: 5, max: 200 }).withMessage('El slug debe tener entre 5 y 200 caracteres.'),
  body('audio_duration')
    .optional()
    .isInt({ min: 1 }).withMessage('La duración debe ser un entero mayor o igual a 1.'),
  body('audio_url')
    .optional({ nullable: true })
    .isURL().withMessage('La URL del audio debe ser válida.'),
  body('audio_author_id')
    .optional()
    .isInt().withMessage('El ID de autor debe ser un entero.'),
  body('audio_category_id')
    .optional()
    .isInt().withMessage('El ID de categoría debe ser un entero.'),
  body('audio_published_at')
    .optional()
    .isISO8601().withMessage('La fecha de publicación debe ser una fecha válida.'),
  body('audio_is_published')
    .optional()
    .isBoolean().withMessage('audio_is_published debe ser booleano.'),
];

module.exports = { validateAudioCreate, validateAudioUpdate };
