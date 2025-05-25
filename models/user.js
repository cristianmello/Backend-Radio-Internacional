const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../database/connection');

const User = sequelize.define('User', {
  user_code: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: "El nombre no puede ser nulo" },
      len: {
        args: [3, 100],
        msg: "El nombre debe tener entre 3 y 100 caracteres"
      },
      is: {
        args: /^[a-zñáéíóú\s]+$/i,
        msg: "El nombre solo puede contener letras, acentos y espacios"
      }
    }
  },
  user_lastname: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notNull: { msg: "El apellido no puede ser nulo" },
      len: {
        args: [3, 150],
        msg: "El apellido debe tener entre 3 y 150 caracteres"
      },
      is: {
        args: /^[a-zñáéíóú\s]+$/i,
        msg: "El apellido solo puede contener letras, acentos y espacios"
      }
    }
  },
  user_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: "Debe ser una fecha válida" },
      isOldEnough(value) {
        if (value) {
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - 12);
          if (new Date(value) > minDate) {
            throw new Error("El usuario debe tener al menos 12 años");
          }
        }
      }
    }
  },
  user_mail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: "Este correo ya está registrado" },
    validate: {
      notNull: { msg: "El correo no puede ser nulo" },
      isEmail: { msg: "Debe ser un correo válido" }
    }
  },
  user_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\d\s+\-()]+$/i,
        msg: "Formato de teléfono inválido"
      }
    }
  },
  user_image: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'https://storage.bunnycdn.com/radiointernacional/profile-images/default.webp'
  },
  user_password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: {
      model: 'roles',
      key: 'role_code'
    },
    onDelete: 'RESTRICT'
  },
  is_vip: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  defaultScope: {
    attributes: { exclude: ['user_password'] }
  },
  indexes: [
    { unique: true, fields: ['user_mail'] },
    { fields: ['role_code'] },
    { fields: ['is_vip'] },
    { fields: ['is_verified'] }

  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.user_password) {
        user.user_password = await bcrypt.hash(user.user_password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('user_password')) {
        user.user_password = await bcrypt.hash(user.user_password, 10);
      }
    }
  }
});

module.exports = User;