const { validationResult } = require('express-validator');
const redisClient = require('../../services/redisclient');
const User = require('../../models/user');

const resetPassword = async (req, res) => {
  // Validar errores del body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { user_password } = req.body;
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ status: 'error', message: 'Token no proporcionado.' });
  }

  try {
    // Verificar token en Redis
    const userCode = await redisClient.get(`reset_token_${token}`);
    if (!userCode) {
      return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
    }

    // Buscar usuario
    const user = await User.findByPk(userCode);
    if (!user) {
      // Eliminar token para seguridad
      await redisClient.del(`reset_token_${token}`);
      await redisClient.del(`reset_user_${userCode}`);
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    // Cambiar contraseña (el hook hash se encarga)
    user.user_password = user_password;
    await user.save();

    // Eliminar tokens de Redis
    await redisClient.del(`reset_token_${token}`);
    await redisClient.del(`reset_user_${userCode}`);

    return res.json({ status: 'success', message: 'Contraseña actualizada correctamente.' });

  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ status: 'error', message: 'Error del servidor.' });
  }
};

module.exports = resetPassword;
