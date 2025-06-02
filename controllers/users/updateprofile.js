const User = require('../../models/user');
const ProfileChangeLog = require('../../models/profilechangelog');

const updateProfile = async (req, res) => {
  try {
    const user_code = req.user.id;

    // Posibilidad futura de permitir que un admin edite el perfil de otro usuario
    const changed_by = user_code;

    // Campos permitidos a actualizar
    const fieldsToUpdate = ['user_name', 'user_lastname', 'user_birth', 'user_phone'];
    const updates = {};

    // Sanitizar y preparar los campos
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        if (typeof value === 'string') {
          updates[field] = value.trim();
        } else {
          updates[field] = value;
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No se enviaron campos válidos para actualizar.' });
    }

    // Buscar usuario por su ID
    const user = await User.findByPk(user_code);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    const changeLogs = [];

    // Detectar cambios y construir logs
    for (const field of fieldsToUpdate) {
      if (updates[field] !== undefined && updates[field] !== user[field]) {
        changeLogs.push({
          user_code: user_code,
          changed_by: changed_by,
          field: field,
          old_value: user[field] !== null ? String(user[field]) : null,
          new_value: updates[field] !== null ? String(updates[field]) : null,
          changed_at: new Date()
        });

        user[field] = updates[field]; // Aplicar cambios
      }
    }

    if (changeLogs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se detectaron cambios en el perfil.'
      });
    }

    // Guardar cambios del usuario
    await user.save();

    // Intentar guardar logs
    try {
      await ProfileChangeLog.bulkCreate(changeLogs);
    } catch (logError) {
      console.warn('[updateProfile] Perfil actualizado pero falló el log de cambios:', logError);
      // No cortamos la ejecución si falla el log
    }

    return res.json({
      status: 'success',
      message: 'Perfil actualizado correctamente.',
      changes_logged: changeLogs.length
    });

  } catch (error) {
    console.error('[updateProfile] Error inesperado:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor.'
    });
  }
};

module.exports = updateProfile;
