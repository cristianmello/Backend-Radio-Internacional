const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Membership = sequelize.define('Membership', {
  membership_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  user_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_code'
    },
    onDelete: 'CASCADE'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (this.start_date && value < this.start_date) {
          throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'expired']],
        msg: "El estado debe ser 'active' o 'expired'"
      }
    }
  }
}, {
  tableName: 'memberships',
  timestamps: false,
  indexes: [
    { fields: ['user_code'] },
    { fields: ['status'] }
  ]
});

module.exports = Membership;
