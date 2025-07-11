const express = require('express');
const router = express.Router();

// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');
const validateArticleCreate = require('../middleware/validatearticlecreate');
const validateArticleUpdate = require('../middleware/validatearticleupdate');
const validateGetArticles = require('../middleware/validategetarticles');
const validateGetArticleById = require('../middleware/validategetarticlebyid');
const uploadArticleImage = require('../middleware/articles/uploadarticleimages');
const sharpArticleImage = require('../middleware/articles/sharparticleimage');
const uploadContentImage = require('../middleware/articles/uploadcontentimage');

// Controllers
const {
  GetArticles,
  GetRelatedArticles,
  GetDraftArticles,
  GetAvailableArticleForSection,
  GetArticleByID,
  CreateArticle,
  UpdateArticle,
  UploadArticleContentImage,
  DeleteArticle,
  GetArticleHistory,
  GetArticleHistoryCSV,
} = require('../controllers/articles');

// ————— RUTAS PÚBLICAS —————
// Listado paginado, con validación de query params
router.get('/', validateGetArticles, GetArticles);

// Rutas de “related” **antes** que `/:id/:slug`
router.get('/:id/related', GetRelatedArticles);

// Búsqueda por ID+slug (canonical redirect)
router.get('/:id/:slug', validateGetArticleById, GetArticleByID);

// ————— RUTAS PROTEGIDAS (edición) —————
router.post(
  '/upload-image',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  uploadContentImage,
  UploadArticleContentImage
);
router.get('/drafts',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  GetDraftArticles
);
router.get('/available-for-section',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  GetAvailableArticleForSection
);

// Crear
router.post('/',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  uploadArticleImage,
  sharpArticleImage,
  validateArticleCreate,
  handleValidationErrors,
  CreateArticle
);

// Actualizar
router.put('/:id',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  uploadArticleImage,
  sharpArticleImage,
  validateArticleUpdate,
  handleValidationErrors,
  UpdateArticle
);

// Borrar
router.delete('/:id',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  DeleteArticle
);

// Historial
router.get('/history',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  GetArticleHistory
);
router.get('/history/csv',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  GetArticleHistoryCSV
);

module.exports = router;

