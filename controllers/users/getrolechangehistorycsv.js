const { Op } = require('sequelize');
const RoleChangeHistory = require('../../models/rolechangelog');
const User = require('../../models/user');
const Role = require('../../models/role');
const { Parser } = require('json2csv');

const GetRoleChangeHistoryCSV = async (req, res) => {
    try {
        const { user_code, from, to } = req.query;

        const where = {};
        if (user_code) where.user_code = user_code;
        if (from || to) {
            where.changed_at = {
                ...(from && { [Op.gte]: new Date(from) }),
                ...(to && { [Op.lte]: new Date(to) })
            };
        }

        const changes = await RoleChangeHistory.findAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['user_code', 'user_name', 'user_mail'] },
                { model: Role, as: 'oldRole', attributes: ['role_name'] },
                { model: Role, as: 'newRole', attributes: ['role_name'] },
                { model: User, as: 'admin', attributes: ['user_name'] }
            ],
            order: [['changed_at', 'DESC']]
        });

        if (!changes.length) return res.status(404).json({ message: 'No se encontraron cambios de roles' });

        const mapped = changes.map(change => ({
            Usuario: `${change.user.user_name} (${change.user.user_mail})`,
            'Rol anterior': change.oldRole?.role_name || 'N/A',
            'Nuevo rol': change.newRole?.role_name || 'N/A',
            'Modificado por': change.admin?.user_name || 'N/A',
            'Fecha de cambio': change.changed_at.toISOString()
        }));

        const parser = new Parser();
        const csv = parser.parse(mapped);

        res.header('Content-Type', 'text/csv');
        res.attachment('historial-cambios-rol.csv');
        return res.send(csv);
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el CSV' });
    }
};

module.exports = GetRoleChangeHistoryCSV;
