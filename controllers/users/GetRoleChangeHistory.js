const { Op } = require('sequelize');
const RoleChangeLog = require('../../models/RoleChangeLog');
const User = require('../../models/User');
const Role = require('../../models/Role');

const getRoleChangeHistory = async (req, res) => {
  try {
    const { user_code, changed_by, from, to, page = 1, limit = 10 } = req.query;

    const where = {};

    if (user_code) where.user_code = user_code;
    if (changed_by) where.changed_by = changed_by;

    if (from || to) {
      where.changed_at = {};
      if (from) where.changed_at[Op.gte] = new Date(from);
      if (to) where.changed_at[Op.lte] = new Date(to);
    }

    const offset = (page - 1) * limit;

    const logs = await RoleChangeLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['user_code', 'user_name'] },
        { model: User, as: 'changer', attributes: ['user_code', 'user_name'] },
        { model: Role, as: 'oldRole', attributes: ['role_name'] },
        { model: Role, as: 'newRole', attributes: ['role_name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['changed_at', 'DESC']]
    });

    return res.json({
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit),
      logs: logs.rows
    });
  } catch (error) {
    console.error('Error al obtener historial de roles:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = getRoleChangeHistory