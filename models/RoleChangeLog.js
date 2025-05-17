const { DataTypes } = require('sequelize');
const sequelize = require('../database/Connection');

const RoleChangeLog = sequelize.define('RoleChangeLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  old_role_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  new_role_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  changed_by: { // Código del usuario que hace el cambio (por ejemplo, un admin)
    type: DataTypes.INTEGER,
    allowNull: false
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'role_change_logs',
  timestamps: false
});

module.exports = RoleChangeLog;
