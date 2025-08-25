// Reemplaza TODO tu archivo con este código
require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;

const poolOptions = {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
};

if (process.env.NODE_ENV === 'production') {

  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    protocol: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: poolOptions
  });

} else {
  database = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: true,
    pool: poolOptions
  });
}

module.exports = database;