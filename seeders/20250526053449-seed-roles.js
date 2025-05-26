"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "roles",
      [
        { role_code: 1, role_name: "user" },
        { role_code: 2, role_name: "editor" },
        { role_code: 3, role_name: "admin" },
        { role_code: 4, role_name: "superadmin" },
      ],
      {
        updateOnDuplicate: ["role_name"],
      }
    );
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.bulkDelete(
      "roles",
      {
        role_code: { [Sequelize.Op.in]: [1, 2, 3, 4] },
      },
      {}
    );
  },
};
