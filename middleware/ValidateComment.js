const { check } = require('express-validator');

const validateComment = [
  check('comment_content')
    .notEmpty().withMessage('El contenido del comentario es obligatorio')
    .isLength({ min: 3, max: 1000 }).withMessage('El comentario debe tener entre 3 y 1000 caracteres')
];

module.exports = validateComment;
