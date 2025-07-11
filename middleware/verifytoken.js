const jwt = require('jsonwebtoken');
const redisClient = require('../services/redisclient');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('[verifyToken] Falta la variable ACCESS_TOKEN_SECRET');
}

/**
 * Middleware para proteger rutas autenticadas con JWT
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de acceso no proporcionado',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    // Verificar si el token fue revocado
    const isRevoked = await redisClient.get(`bl_at_${decoded.jti}`);
    if (isRevoked === 'true') {
      return res.status(403).json({
        status: 'error',
        message: 'Token revocado',
      });
    }

    req.user = {
      id: decoded.sub,
      name: decoded.name,
      lastname: decoded.lastname,
      email: decoded.email,
      roles: decoded.roles || [],
      tokenId: decoded.jti
    };

    next();
  } catch (err) {
    console.error('[verifyToken] Token inválido:', err.message);

    // DEVOLVER 401 si el token expiró, 403 si hay otro problema
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expirado',
      });
    }

    return res.status(403).json({
      status: 'error',
      message: 'Token inválido',
    });
  }
}

module.exports = verifyToken;
