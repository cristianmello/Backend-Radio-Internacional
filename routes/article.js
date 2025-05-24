const express = require('express');
const { check } = require('express-validator');
const router = express.Router();


// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');
const validateArticleCreate = require('../middleware/validatearticlecreate');
const validateArticleUpdate = require('../middleware/validatearticleupdate');
const validateGetArticles = require('../middleware/validategetarticles');
const validateGetArticleById = require('../middleware/validategetarticlebyid');

// Controllers
const {
    GetArticles,
    GetArticleByID,
    CreateArticle,
    UpdateArticle,
    DeleteArticle
} = require('../controllers/articles');

router.get('/', validateGetArticles, GetArticles);
router.get('/:id', validateGetArticleById, GetArticleByID);

router.post(
    '/',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateArticleCreate,
    handleValidationErrors,
    CreateArticle
);

router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateArticleUpdate,
    handleValidationErrors,
    UpdateArticle
);


router.delete(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    DeleteArticle
);

module.exports = router;
