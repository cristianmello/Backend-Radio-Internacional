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
  validateReorder,
  validateUpdateSection
} = require('../middleware/sections/validatesection');

// Controllers
const {
  GetSections,
  GetSectionItems,
  CreateSection,
  DeleteSection,
  AddItemToSection,
  RemoveItemFromSection,
  ReorderSectionItems,
  UpdateSection,

} = require('../controllers/sections');

router.get(
  '/',
  GetSections
);

router.post(
  '/',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateCreateSection,
  handleValidationErrors,
  CreateSection
);

router.put(
  '/:slug/reorder',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateReorder,
  handleValidationErrors,
  ReorderSectionItems
);

router.delete(
  '/:slug/:code',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateRemoveItem,
  handleValidationErrors,
  RemoveItemFromSection
);

router.put(
  '/:slug',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateUpdateSection,
  handleValidationErrors,
  UpdateSection
);

router.post(
  '/:slug',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateAddItem,
  handleValidationErrors,
  AddItemToSection
);

router.delete(
  '/:slug',
  authenticate,
  authorize('editor', 'admin', 'superadmin'),
  validateGetSection,
  handleValidationErrors,
  DeleteSection
);

router.get(
  '/:slug',
  validateGetSection,
  handleValidationErrors,
  GetSectionItems
);



module.exports = router;

