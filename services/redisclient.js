/*// services/RedisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const url = process.env.REDIS_URL; 
const redisOptions = {
  url,
  socket: {
    // reconexión automática exponencial
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    // timeouts en ms
    connectTimeout: 10000,
    keepAlive: 30000,
  },
  // opcionales: ajustes de rendimiento
  // maxRetriesPerRequest: 5,
  // enableOfflineQueue: true,
};

const redisClient = createClient(redisOptions);

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis: conectado');
});
redisClient.on('ready', () => {
  console.log('Redis: listo para usar');
});
redisClient.on('end', () => {
  console.log('Redis: conexión cerrada');
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Error conectando a Redis:', err);
    process.exit(1); // no arrancar si no hay cache/store disponible
  }
})();

module.exports = redisClient;
*/

// services/RedisClient.js
const Redis = require('ioredis');
// Forzando el redespliegue en Railway

//const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
const redisUrl = process.env.REDIS_URL

const redisClient = new Redis(redisUrl);

redisClient.on('connect', () => console.log('[Redis] Conectado a Redis:', redisUrl));
redisClient.on('error', err => console.error('[Redis] Error de conexión:', err));

module.exports = redisClient;
