// controllers/users/login.js
const { createToken, createRefreshToken } = require('../../services/jwt');
const bcrypt = require('bcrypt');
const User = require('../../models/user');

const login = async (req, res) => {
  const { user_mail, user_password } = req.body;
  const user = await User.findOne({
    where: { user_mail },
    attributes: ['user_code', 'user_mail', 'user_password', 'role_code', 'is_verified'],
    include: [{ association: 'role', attributes: ['role_name'] }]
  });

  if (!user) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });
  if (!user.is_verified) return res.status(403).json({ status: 'error', message: 'Debes verificar tu correo.' });

  const match = await bcrypt.compare(user_password, user.user_password);
  if (!match) return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });

  const accessToken = createToken(user);
  const refreshToken = createRefreshToken(user);

  // Almacenar jti opcionalmente en whitelist (no obligatorio si sólo usas blacklist)
  // const { jti } = jwt.decode(refreshToken);
  // await redisClient.sadd(`rtls_${user.user_code}`, jti);
  // await redisClient.expire(`rtls_${user.user_code}`, /* segundos de REFRESH_TOKEN_EXPIRES */);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
  });

  res.status(200).json({ status: 'success', message: 'Inicio de sesión exitoso.', token: accessToken });
};

module.exports = login;