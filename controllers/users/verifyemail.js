// controllers/users/verifyEmail.js
const redisClient = require('../../services/redisclient');
const User = require('../../models/user');
require('dotenv').config();

const CLIENT_URL = process.env.CLIENT_URL;

const verifyEmail = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ status: 'error', message: 'Falta el token de verificación.' });
  }

  const userCode = await redisClient.get(`verify_${token}`);
  if (!userCode) {
    return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
  }

  const user = await User.findByPk(userCode);
  if (!user) {
    await redisClient.del(`verify_${token}`);
    return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
  }

  if (user.is_verified) {
    await redisClient.del(`verify_${token}`);
    return res.json({ status: 'success', message: 'Correo ya estaba verificado.' });
  }

  user.is_verified = true;
  await user.save();
  await redisClient.del(`verify_${token}`);

  // Redirigir a una página de éxito en el front
  return res.redirect(`${CLIENT_URL}/email-verified-success`);
};

module.exports = verifyEmail;
