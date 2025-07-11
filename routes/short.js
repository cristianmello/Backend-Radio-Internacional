const express = require('express');
const router = express.Router();

// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');
const { validateShortCreate, validateShortUpdate } = require('../middleware/shorts/validateshort');
const validateGetShorts = require('../middleware/shorts/validategetshorts');
const validateGetShortById = require('../middleware/shorts/validategetshortbyid');

// Controllers
const {
    GetShorts,
    GetDraftShorts,
    GetShortByID,
    CreateShort,
    UpdateShort,
    DeleteShort,
    GetShortHistory,
    GetShortHistoryCSV,
} = require('../controllers/shorts');

// Rutas públicas
router.get('/', validateGetShorts, GetShorts);
router.get('/drafts', authenticate, authorize('editor', 'admin', 'superadmin'), GetDraftShorts);
router.get('/:id', validateGetShortById, GetShortByID);

// Rutas protegidas
router.post(
    '/',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateShortCreate,
    handleValidationErrors,
    CreateShort
);

router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    validateShortUpdate,
    handleValidationErrors,
    UpdateShort
);

router.delete(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    DeleteShort
);

router.get(
    '/history',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetShortHistory
);

router.get(
    '/history/csv',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetShortHistoryCSV
);

module.exports = router;
