const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        campo: err.param,
        mensaje: err.msg
      }))
    });
  }

  next();
};

module.exports = handleValidationErrors;

