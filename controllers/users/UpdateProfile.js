const User = require('../../models/User');

const updateProfile = async (req, res) => {
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

  res.json({ status: 'success', message: 'Perfil actualizado.' });
};

module.exports = updateProfile;
