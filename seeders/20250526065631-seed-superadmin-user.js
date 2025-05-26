'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const {
      SUPERADMIN_NAME,
      SUPERADMIN_LASTNAME,
      SUPERADMIN_BIRTH,
      SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD,
      SUPERADMIN_ROLE_CODE,
      SUPERADMIN_IMAGE_URL
    } = process.env;

    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE user_mail = :email LIMIT 1`,
      {
        replacements: { email: SUPERADMIN_EMAIL },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

      await queryInterface.bulkInsert('users', [
        {
          user_name: SUPERADMIN_NAME,
          user_lastname: SUPERADMIN_LASTNAME,
          user_birth: SUPERADMIN_BIRTH,
          user_mail: SUPERADMIN_EMAIL,
          user_phone: null,
          user_image: SUPERADMIN_IMAGE_URL,
          user_password: hashedPassword,
          role_code: Number(SUPERADMIN_ROLE_CODE),
          is_vip: false,
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      console.log('✅ Superadmin creado correctamente.');
    } else {
      console.log('ℹ️ Superadmin ya existe. No se insertó nuevamente.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      user_mail: process.env.SUPERADMIN_EMAIL
    }, {});
  }
};
