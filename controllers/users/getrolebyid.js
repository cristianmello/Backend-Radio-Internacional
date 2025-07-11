// Importamos el modelo de Role
const Role = require('../../models/role');

/**
 * Controlador para obtener un único rol por su ID (role_code).
 */
const getRoleById = async (req, res) => {
    try {
        // Obtenemos el role_code de los parámetros de la URL
        const role_code = Number(req.params.role_code);

        // Validamos que el ID sea un número válido
        if (!Number.isInteger(role_code) || role_code <= 0) {
            return res.status(400).json({ status: 'error', message: 'ID de rol inválido.' });
        }

        // Buscamos el rol por su clave primaria (PK)
        const role = await Role.findByPk(role_code, {
            attributes: ['role_code', 'role_name', 'role_description']
        });

        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Rol no encontrado.' });
        }

        return res.status(200).json({ status: 'success', data: role });

    } catch (error) {
        console.error(`[getRoleById] Error al obtener rol ${req.params.role_code}:`, error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
};

module.exports = getRoleById;