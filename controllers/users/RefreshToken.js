// controllers/users/refreshToken.js
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { createToken } = require('../../services/Jwt');
const redisClient = require('../../services/RedisClient');
require('dotenv').config();

const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refresh_token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Refresh token requerido.' });

  let payload;
  try { payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET); }
  catch (err) { return res.status(401).json({ status: 'error', message: err.message || 'Refresh token inválido o expirado.' }); }

  const isRevoked = await redisClient.get(`bl_rt_${payload.jti}`);
  if (isRevoked === 'true') return res.status(401).json({ status: 'error', message: 'Refresh token revocado.' });

  const user = await User.findByPk(payload.sub, { attributes: ['user_code','user_mail','role_code'], include: [{ association: 'role', attributes: ['role_name'] }] });
  if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });

  const newAccessToken = createToken(user);
  res.status(200).json({ status: 'success', message: 'Token renovado correctamente.', token: newAccessToken });
};

module.exports = refreshToken;