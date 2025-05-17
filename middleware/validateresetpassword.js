// middleware/ValidateResetPassword.js
const { check } = require('express-validator');

const validateResetPassword = [
  check('token')
    .notEmpty()
    .withMessage('Falta el token de reseteo.'),

  check('newPassword')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/\d/)
    .withMessage('Debe contener al menos un número.')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una letra mayúscula.'),
];

module.exports = validateResetPassword;
