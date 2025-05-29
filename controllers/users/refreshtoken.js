const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const redisClient = require('../../services/redisclient');
const { createToken, createRefreshToken } = require('../../services/jwt');

const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refresh_token;
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Refresh token requerido.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ status: 'error', message: err.message || 'Refresh token inválido o expirado.' });
  }

  // Verificar si fue revocado
  const isRevoked = await redisClient.get(`bl_rt_${payload.jti}`);
  if (isRevoked === 'true') {
    return res.status(401).json({ status: 'error', message: 'Refresh token revocado.' });
  }

  // Buscar usuario
  const user = await User.findByPk(payload.sub, {
    attributes: ['user_code', 'user_mail', 'role_code'],
    include: [{ association: 'role', attributes: ['role_name'] }]
  });

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
  }

  // 1. Revocar el refresh token anterior (actual)
  await redisClient.set(`bl_rt_${payload.jti}`, 'true', 'EX', 60 * 60 * 24 * 30); // 30 días

  // 2. Generar nuevos tokens
  const newAccessToken = createToken(user);
  const newRefreshToken = createRefreshToken(user);

  // 3. (Opcional) Guardar jti del nuevo refresh token en whitelist por usuario
  const { jti: newJti } = jwt.decode(newRefreshToken);
  await redisClient.sadd(`rtls_${user.user_code}`, newJti);
  await redisClient.expire(`rtls_${user.user_code}`, 60 * 60 * 24 * 30); // 30 días

  // (Opcional extra) Limitar máximo 5 sesiones activas
  const allJtis = await redisClient.smembers(`rtls_${user.user_code}`);
  if (allJtis.length > 5) {
    const jtisToRemove = allJtis.slice(0, allJtis.length - 5);
    for (const jti of jtisToRemove) {
      await redisClient.srem(`rtls_${user.user_code}`, jti);
      await redisClient.set(`bl_rt_${jti}`, 'true', 'EX', 60 * 60 * 24 * 30);
    }
  }

  // 4. Enviar nuevo refresh token como cookie y access token por body
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
  });

  return res.status(200).json({
    status: 'success',
    message: 'Tokens renovados correctamente.',
    token: newAccessToken
  });
};

module.exports = refreshToken;
