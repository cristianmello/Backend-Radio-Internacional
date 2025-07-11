const { createToken, createRefreshToken } = require('../../services/jwt');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../../services/redisclient');
const User = require('../../models/user');
const LoginLog = require('../../models/loginlog');

const login = async (req, res) => {
  const { user_mail, user_password } = req.body;

  const user = await User.findOne({
    where: { user_mail },
    attributes: ['user_code', 'user_mail', 'user_password', 'role_code', 'is_verified'],
    include: [{ association: 'role', attributes: ['role_name'] }]
  });

  if (!user) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });

  const match = await bcrypt.compare(user_password, user.user_password);
  if (!match) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });

  if (!user.is_verified) {
    // Devolvemos un error específico que el frontend pueda identificar
    return res.status(403).json({
      status: 'error',
      code: 'ACCOUNT_NOT_VERIFIED',
      message: 'Su cuenta no ha sido verificada.'
    });
  }

  const accessToken = createToken(user);
  const refreshToken = createRefreshToken(user);

  // Extraer y guardar el jti en whitelist de Redis
  const { jti } = jwt.decode(refreshToken);
  await redisClient.sadd(`rtls_${user.user_code}`, jti);
  await redisClient.expire(`rtls_${user.user_code}`, 60 * 60 * 24 * 30); // 30 días

  // Limitar máximo 5 sesiones activas por usuario
  const allJtis = await redisClient.smembers(`rtls_${user.user_code}`);
  if (allJtis.length > 5) {
    const jtisToRemove = allJtis.slice(0, allJtis.length - 5);
    for (const oldJti of jtisToRemove) {
      await redisClient.srem(`rtls_${user.user_code}`, oldJti);
      await redisClient.set(`bl_rt_${oldJti}`, 'true', 'EX', 60 * 60 * 24 * 30); // Blacklist para prevenir uso futuro
    }
  }

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
  });


  try {
    await LoginLog.create({
      user_code: user.user_code,
      user_mail: user.user_mail,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Error guardando log de login:', error);
  }

  res.status(200).json({
    status: 'success',
    message: 'Inicio de sesión exitoso.',
    token: accessToken
  });
};

module.exports = login;
