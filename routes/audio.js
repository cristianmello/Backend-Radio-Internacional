// src/routes/audios.js
const express = require('express');
const router = express.Router();

// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');

const uploadAudio = require('../middleware/audios/uploadaudio');
const processAudio = require('../middleware/audios/processaudio');
const {
    validateAudioCreate,
    validateAudioUpdate
} = require('../middleware/audios/validateaudio');
const validateGetAudios = require('../middleware/audios/validategetaudios');
const validateGetAudioById = require('../middleware/audios/validategetaudioid');

// Controllers
const {
    GetAudios,
    GetDraftAudios,
    GetAudioByID,
    CreateAudio,
    UpdateAudio,
    DeleteAudio,
    GetAudioHistory,
    GetAudioHistoryCSV
} = require('../controllers/audios');

// Public routes
router.get(
    '/',
    validateGetAudios,
    handleValidationErrors,
    GetAudios
);

router.get(
    '/drafts',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetDraftAudios
);

router.get(
    '/history',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetAudioHistory
);

router.get(
    '/history/csv',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    GetAudioHistoryCSV
);

router.get(
    '/:id',
    validateGetAudioById,
    handleValidationErrors,
    GetAudioByID
);


// Protected routes
router.post(
    '/',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    uploadAudio,           // multer memoryStorage + fileFilter
    processAudio,          // genera req.processedAudio
    validateAudioCreate,
    handleValidationErrors,
    CreateAudio
);

router.put(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    uploadAudio,           // multer memoryStorage + fileFilter
    processAudio,          // genera req.processedAudio
    validateAudioUpdate,
    handleValidationErrors,
    UpdateAudio
);

router.delete(
    '/:id',
    authenticate,
    authorize('editor', 'admin', 'superadmin'),
    DeleteAudio
);

module.exports = router;
