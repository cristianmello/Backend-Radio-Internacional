// Reemplaza TODO tu archivo con este código
require('dotenv').config();

const { Sequelize } = require('sequelize');
let database;

if (process.env.NODE_ENV === 'production') {

  database = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    protocol: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true
      }
    }
  });

} else {
  database = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: true,
  });
}

module.exports = database;