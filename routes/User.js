// routes/users.js
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

// Controladores
const {
  Register,
  Login,
  RefreshToken,
  GetProfile,
  UpdateProfile,
  ChangePassword,
  DeleteAccount,
  ForgotPassword,
  Logout,
  ResetPassword,
  RevokeRefreshToken,
  SendVerificationEmail,
  VerifyEmail,
  GetAllUsers,
  UpdateRole,
  GetRoleChangeHistory,
  GetRoleChangeHistoryCSV,
} = require('../controllers/users/');

// Middlewares
const handleValidationErrors = require('../middleware/HandleValidationErrors');
const validateLogin = require('../middleware/LoginValidator');
const validateUserRegister = require('../middleware/ValidateUserRegister');
const authenticate = require('../middleware/VerifyToken');
const authorize = require('../middleware/AuthorizeRole');
const isOwnerOrAdmin = require('../middleware/IsOwnerOrAdmin');
const loginLimiter = require('../services/rateLimiter/LoginLimiter').rateLimiter;
const forgotPasswordLimiter = require('../services/rateLimiter/ForgotPasswordLimiter').forgotPasswordLimiter;
const emailVerificationLimiter = require('../services/rateLimiter/EmailVerificationLimiter').emailVerificationLimiter;
const validateResetPassword = require('../middleware/ValidateResetPassword');
const validateChangePassword = require('../middleware/ValidateChangePassword');
const validateUserUpdate = require('../middleware/ValidateUserUpdate');
const updateProfileLimiter = require('../services/rateLimiter/UpdateProfileLimiter').rateLimiter;


// Rutas públicas
router.post('/register', validateUserRegister, handleValidationErrors, Register);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, Login);
router.post('/refresh-token', RefreshToken);
router.post('/forgot-password',
  forgotPasswordLimiter,
  [check('user_mail').isEmail().withMessage('Debe ser un correo válido')],
  handleValidationErrors,
  ForgotPassword
);
router.post(
  '/reset-password',
  forgotPasswordLimiter,
  validateResetPassword,
  handleValidationErrors,
  ResetPassword
);
// Verificación de email
router.post(
  '/send-verification-email',
  emailVerificationLimiter,
  [check('user_mail').isEmail().withMessage('Debe ser un correo válido')],
  handleValidationErrors,
  SendVerificationEmail
);
// El usuario abre este enlace en el navegador
router.get('/verify-email', VerifyEmail);

// A partir de aquí, requieren JWT
router.use(authenticate);


router.get('/profile', GetProfile);
router.put(
  '/update',
  isOwnerOrAdmin(req => req.user.id),
  updateProfileLimiter,
  validateUserUpdate,
  handleValidationErrors,
  UpdateProfile
);

router.post(
  '/change-password',
  validateChangePassword,
  handleValidationErrors,
  authenticate,
  ChangePassword
);
router.post('/logout', Logout);

// Rutas de admin
router.delete('/:user_code', authorize('admin', 'superadmin'), DeleteAccount);
router.post('/revoke-refresh-token', authorize('admin', 'superadmin'), RevokeRefreshToken);
router.get('/', authorize('superadmin'), GetAllUsers);
router.put('/role/:user_code', authorize('superadmin'), UpdateRole);
router.get('/role-history', authorize('superadmin'), GetRoleChangeHistory);
router.get('/role-history/export', authorize('superadmin'), GetRoleChangeHistoryCSV);

module.exports = router;
