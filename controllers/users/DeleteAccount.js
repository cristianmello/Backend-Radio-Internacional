const User = require('../../models/user');
const Role = require('../../models/role');

// Jerarquía de roles
const roleHierarchy = {
  user: 1,
  editor: 2,
  admin: 3,
  superadmin: 4
};

const deleteAccount = async (req, res) => {

  const { user_code } = req.params;
  const isSelfDelete = req.user.id == user_code;

  try {
    // Buscar usuario objetivo con su rol
    const userToDelete = await User.findByPk(user_code, {
      include: {
        model: Role,
        as: 'role',
        attributes: ['role_name']
      }
    });

    if (!userToDelete) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    const requesterMaxRole = Math.max(...(req.user.roles.map(r => roleHierarchy[r] || 0)));
    const targetRole = userToDelete.role?.role_name;
    const targetMaxRole = roleHierarchy[targetRole] || 0;

    // Si no se está eliminando a sí mismo y tiene igual o menor jerarquía, denegar
    if (!isSelfDelete && requesterMaxRole <= targetMaxRole) {
      return res.status(403).json({
        status: 'error',
        message: `No puedes eliminar a un usuario con rol igual o superior ("${targetRole}").`
      });
    }

    // Eliminar cuenta (permitido)
    await userToDelete.destroy();

    return res.json({ status: 'success', message: 'Cuenta eliminada correctamente.' });
  } catch (err) {
    console.error('[DeleteAccount]', err);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
  }
};

module.exports = deleteAccount;
