// controllers/users/logout.js
const jwt = require('jsonwebtoken');
const redisClient = require('../../services/redisclient');

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.headers.authorization?.split(' ')[1];

  // Revocar Refresh Token
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      // 1. Agregar a blacklist
      await redisClient.set(`bl_rt_${payload.jti}`, 'true', 'EX', 60 * 60 * 24 * 30); // 30 días

      // 2. Eliminar de whitelist (si estás usando sesiones activas por usuario)
      if (payload.sub) {
        await redisClient.srem(`rtls_${payload.sub}`, payload.jti);
      }
    } catch (err) {
      console.warn('[Logout] Refresh token inválido, se ignorará blacklist y whitelist.');
    }
  }

  // Revocar Access Token
  if (accessToken) {
    try {
      const atPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      await redisClient.set(`bl_at_${atPayload.jti}`, 'true', 'EX', 60 * 15);
    } catch (err) {
      console.warn('[Logout] Access token inválido, no se aplicó blacklist.');
    }
  }

  // Limpiar cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  res.json({ status: 'success', message: 'Sesión cerrada correctamente.' });
};

module.exports = logout;
