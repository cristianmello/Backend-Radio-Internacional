const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Membership = sequelize.define(
  'Membership',
  {
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
      onDelete: 'CASCADE',
      validate: {
        isInt: { msg: 'El código de usuario debe ser un número entero' }
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' }
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' },
        isAfterStartDate(value) {
          // this.start_date ya está validada como DATEONLY
          if (this.start_date && value < this.start_date) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
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
  },
  {
    tableName: 'memberships',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_memberships_user_code',
        fields: ['user_code']
      },
      {
        name: 'idx_memberships_status',
        fields: ['status']
      },
      {
        name: 'uq_memberships_dates',
        unique: true,
        fields: ['user_code', 'start_date', 'end_date']
      }
    ],
    hooks: {
      beforeCreate: (membership) => {
      }
    }
  }
);

module.exports = Membership;
