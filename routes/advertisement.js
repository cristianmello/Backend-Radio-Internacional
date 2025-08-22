const express = require('express');
const router = express.Router();

// Middlewares Generales
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');

// Middlewares Específicos de Publicidad
const validateAdCreate = require('../middleware/advertisement/validateadcreate');
const validateAdUpdate = require('../middleware/advertisement/validateadupdate');
const uploadAdImage = require('../middleware/advertisement/uploadadimage');
const sharpAdImage = require('../middleware/advertisement/sharpadimage');
const loadAd = require('../middleware/advertisement/loadad');

// Controladores (Asegúrate de crearlos después)
const {
    CreateAd,
    GetAllAds,
    GetAdById,
    UpdateAd,
    DeleteAd,
    GetDraftAds
} = require('../controllers/advertisement');



// GET: Obtener todas las publicidades
router.get('/', GetAllAds);

router.get('/drafts', authenticate, authorize('editor', 'admin', 'superadmin'), GetDraftAds);

// GET: Obtener una publicidad por su ID
router.get(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetAdById
);
// POST: Crear una nueva publicidad
router.post(
    '/',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    uploadAdImage,
    sharpAdImage,
    validateAdCreate,
    handleValidationErrors,
    CreateAd
);

// PUT: Actualizar una publicidad existente
router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    loadAd,
    uploadAdImage,
    sharpAdImage,
    validateAdUpdate,
    handleValidationErrors,
    UpdateAd
);

// DELETE: Eliminar una publicidad
router.delete(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    DeleteAd
);


module.exports = router;