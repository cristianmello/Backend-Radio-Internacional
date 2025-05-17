const redisClient = require('../../services/redisclient');
const { validationResult } = require('express-validator');
const User = require('../../models/user');

const resetPassword = async (req, res) => {
  // 1) Validar errores del body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { token, newPassword } = req.body;

  try {
    // 2) Validar token en Redis
    const userCode = await redisClient.get(`reset_${token}`);
    if (!userCode) {
      return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
    }

    // 3) Buscar usuario
    const user = await User.findByPk(userCode);
    if (!user) {
      await redisClient.del(`reset_${token}`);
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    // 4) Asignar nueva contraseña (sin hashear, el hook lo hace)
    user.user_password = newPassword;
    await user.save();

    // 5) Eliminar token usado
    await redisClient.del(`reset_${token}`);

    return res.json({ status: 'success', message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('[resetPassword] Error interno:', err);
    return res.status(500).json({ status: 'error', message: 'Error del servidor.' });
  }
};

module.exports = resetPassword;
