// routes/articleCategory.js
const express = require('express');
const router = express.Router();

// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');
const validateCategoryCreate = require('../middleware/validatecategorycreate');
const validateCategoryUpdate = require('../middleware/validatecategoryupdate');

const createCategory = require('../controllers/articlecategories/createcategory');
const getAllCategories = require('../controllers/articlecategories/getallcategories');
const getCategoryById = require('../controllers/articlecategories/getcategorybyid');
const getSectionArticles = require('../controllers/articlecategories/sectioncontrollers');
const updateCategory = require('../controllers/articlecategories/updatecategory');
const deleteCategory = require('../controllers/articlecategories/deletecategory');
;
// Rutas públicas
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.get(
    '/api/sections/:sectionSlug/articles',
    getSectionArticles
);

// Rutas protegidas (solo admin y superadmin)
router.post(
    '/',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateCategoryCreate,
    handleValidationErrors,
    createCategory
);

router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateCategoryUpdate,
    handleValidationErrors,
    updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    deleteCategory
);

module.exports = router;
