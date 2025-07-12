/*const { Sequelize } = require('sequelize');

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
*/
// Reemplaza TODO tu archivo con este código

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
        rejectUnauthorized: false
      }
    }
  });

} else {
  database = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: true
    }
  );
}

module.exports = database;