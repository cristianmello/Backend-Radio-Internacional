const { check } = require('express-validator');

const validateLogin = [
  check('user_mail')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail(),

  check('user_password')
    .notEmpty().withMessage('Contraseña requerida')
    .isLength({ min: 6 }).withMessage('Contraseña inválida')
];

module.exports = validateLogin;
