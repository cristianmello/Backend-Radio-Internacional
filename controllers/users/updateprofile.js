const User = require('../../models/user');

const updateProfile = async (req, res) => {
  try {
    const updates = (({ user_name, user_lastname, user_birth, user_phone }) =>
      ({ user_name, user_lastname, user_birth, user_phone }))(req.body);

    const [rowsUpdated] = await User.update(updates, {
      where: { user_code: req.user.id }
    });

    if (rowsUpdated === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se pudo actualizar el perfil o no hubo cambios.'
      });
    }

    return res.json({ status: 'success', message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error('[updateProfile] Error:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
  }
};

module.exports = updateProfile;
