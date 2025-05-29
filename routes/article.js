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

const uploadArticleImage = require('../middleware/articleImageUpload');
const sharpArticleImage = require('../middleware/sharpArticleImage');

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
    uploadArticleImage,
    sharpArticleImage,
    validateArticleCreate,
    handleValidationErrors,
    CreateArticle
);

router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    uploadArticleImage,
    sharpArticleImage,
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
