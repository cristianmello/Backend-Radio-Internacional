const bcrypt = require('bcrypt');
const User = require('../../models/user');

// 10) Change password (autenticado)
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const match = await bcrypt.compare(oldPassword, user.user_password);
  if (!match) {
    return res.status(401).json({ status: 'error', message: 'Contraseña actual incorrecta.' });
  }
  const salt = await bcrypt.genSalt(12);
  user.user_password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({ status: 'success', message: 'Contraseña cambiada correctamente.' });
};

module.exports = changePassword 