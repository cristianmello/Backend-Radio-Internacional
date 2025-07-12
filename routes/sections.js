const express = require('express');
const router = express.Router();

// Middlewares
const authenticate = require('../middleware/verifytoken');
const authorize = require('../middleware/authorizerole');
const handleValidationErrors = require('../middleware/handlevalidationerrors');

const {
  validateCreateSection,
  validateGetSection,
  validateAddItem,
  validateRemoveItem,
  validateReorder
} = require('../middleware/sections/validatesection');

// Controllers
const {
  GetSections,           // GET    /api/sections
  GetSectionItems,       // GET    /api/sections/:slug
  CreateSection,         // POST   /api/sections
  DeleteSection,         // DELETE /api/sections/:slug
  AddItemToSection,      // POST   /api/sections/:slug
  RemoveItemFromSection, // DELETE /api/sections/:slug/:code
  ReorderSectionItems    // PUT    /api/sections/:slug/reorder
} = require('../controllers/sections');

// 1) Listar todas las secciones
router.get(
  '/',
  GetSections
);

// 2) Crear una sección
router.post(
  '/',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateCreateSection,
  handleValidationErrors,
  CreateSection
);

// 3) Eliminar una sección
router.delete(
  '/:slug',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateGetSection,
  handleValidationErrors,
  DeleteSection
);

// 4) Obtener los ítems de una sección
router.get(
  '/:slug',
  validateGetSection,
  handleValidationErrors,
  GetSectionItems
);

// 5) Añadir un ítem (artículo o short) a la sección
router.post(
  '/:slug',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateAddItem,
  handleValidationErrors,
  AddItemToSection
);

// 6) Quitar un ítem de la sección
router.delete(
  '/:slug/:code',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateRemoveItem,
  handleValidationErrors,
  RemoveItemFromSection
);

// 7) Reordenar los ítems dentro de la sección
router.put(
  '/:slug/reorder',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateReorder,
  handleValidationErrors,
  ReorderSectionItems
);

module.exports = router;
