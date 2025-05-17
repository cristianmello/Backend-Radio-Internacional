// controllers/users/logout.js
const jwt = require('jsonwebtoken');
const redisClient = require('../../services/RedisClient');
require('dotenv').config();

const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await redisClient.set(`bl_rt_${payload.jti}`, 'true', 'EX', 60 * 60 * 24 * 30);
    } catch (err) {
      console.warn('[Logout] Token inválido, se ignorará blacklist.');
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ status: 'success', message: 'Sesión cerrada correctamente.' });
};

module.exports = logout;
