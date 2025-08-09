// middleware/validateComment.js

const { check, param } = require('express-validator');

// Reglas para crear o actualizar un comentario
const validateContent = [
    check('content')
        .trim()
        .notEmpty().withMessage('El contenido del comentario no puede estar vacío.')
        .isLength({ min: 3, max: 5000 }).withMessage('El comentario debe tener entre 3 y 5000 caracteres.')
];

// Reglas para la votación
const validateVote = [
    check('direction')
        .notEmpty().withMessage('La dirección del voto es requerida.')
        .isInt({ min: -1, max: 1 }).withMessage('La dirección del voto debe ser 1 o -1.')
        .custom(value => value !== 0).withMessage('El valor del voto no puede ser 0.')
];

// Reglas para validar los IDs en los parámetros de la URL
const validateCommentIdParam = [
    param('commentId')
        .isInt({ min: 1 }).withMessage('El ID del comentario debe ser un número entero positivo.')
];

const validateArticleIdParam = [
    param('articleId')
        .isInt({ min: 1 }).withMessage('El ID del artículo debe ser un número entero positivo.')
];

module.exports = {
    validateContent,
    validateVote,
    validateCommentIdParam,
    validateArticleIdParam
};