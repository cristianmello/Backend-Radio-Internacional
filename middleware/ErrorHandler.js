// middleware/errorHandler.js
'use strict';

const { ValidationError } = require('sequelize');

/**
 * Middleware global de manejo de errores.
 * Debe ir AL FINAL de todas las rutas y middlewares.
 */
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Request ID para correlación de logs
  const requestId = req.id || '–';

  // Estructura base de la respuesta
  const errorResponse = {
    status: 'error',
    message: 'Error interno del servidor',
    requestId
  };

  // 1) Errores de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    // err proviene de handleValidationErrors
    return res.status(400).json({
      status: 'error',
      message: 'Errores de validación',
      errors: err.array().map(e => ({ field: e.param, message: e.msg })),
      requestId
    });
  }

  // 2) Errores de JWT (jsonwebtoken)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado',
      requestId
    });
  }

  // 3) Errores de Sequelize
  if (err instanceof ValidationError) {
    return res.status(422).json({
      status: 'error',
      message: 'Error de base de datos: datos no válidos',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
      requestId
    });
  }

  // 4) Errores operacionales (tienen status y mensaje amigable)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      status: 'error',
      message: err.message,
      requestId
    });
  }

  // 5) Cualquier otro (errores de programación, bugs, etc.)
  // Log completo para depuración
  console.error(`[Error][${requestId}]`, err);

  // En desarrollo muestra stack, en producción no
  if (!isProd) {
    errorResponse.stack = err.stack;
  }

  // Responde con 500
  res.status(500).json(errorResponse);
}

module.exports = errorHandler;
