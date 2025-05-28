const { Sequelize } = require('sequelize');

const database = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  }
);

module.exports = database;
