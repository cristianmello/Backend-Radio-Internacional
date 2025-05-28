const redisClient = require('../../services/redisclient');
const User = require('../../models/user');

const CLIENT_URL = process.env.CLIENT_URL;

const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ status: 'error', message: 'Falta el token de verificación o es inválido.' });
    }

    // Buscar al usuario comparando el token con los valores en Redis
    const keys = await redisClient.keys('verify_user_*');
    let userCode = null;

    for (const key of keys) {
      const storedToken = await redisClient.get(key);
      if (storedToken === token) {
        userCode = key.replace('verify_user_', '');
        break;
      }
    }

    if (!userCode) {
      return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
    }

    const user = await User.findByPk(userCode);
    if (!user) {
      await redisClient.del(`verify_user_${userCode}`);
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    if (user.is_verified) {
      await redisClient.del(`verify_user_${userCode}`);
      return res.json({ status: 'success', message: 'Correo ya estaba verificado.' });
    }

    user.is_verified = true;
    await user.save();
    await redisClient.del(`verify_user_${userCode}`);

    return res.redirect(`${CLIENT_URL}/email-verified-success`);
  } catch (err) {
    console.error('[Auth][VerifyEmail]', err);
    return res.status(500).json({ status: 'error', message: 'Error del servidor al verificar el correo.' });
  }
};

module.exports = verifyEmail;
