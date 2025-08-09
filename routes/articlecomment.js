// routes/articlecomment.js

const express = require('express');
const authenticate = require('../middleware/verifytoken'); // Tu middleware de autenticación

const { validateContent, validateArticleIdParam } = require('../middleware/comment/validatecomment');
const handleValidationErrors = require('../middleware/handlevalidationerrors');

// Importamos los controladores necesarios para este contexto
const getArticleComments = require('../controllers/comments/getarticlecomments');
const createComment = require('../controllers/comments/createcomment');

const router = express.Router({ mergeParams: true });

router.get('/', validateArticleIdParam, handleValidationErrors, getArticleComments);

router.post('/', authenticate, validateArticleIdParam, validateContent, handleValidationErrors, createComment);

module.exports = router;