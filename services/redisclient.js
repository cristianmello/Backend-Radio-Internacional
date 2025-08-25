// services/RedisClient.js
const Redis = require('ioredis');

let redisClient;

if (process.env.NODE_ENV === 'production') {
  const redisUrl = process.env.REDIS_PUBLIC_URL;
  
  redisClient = new Redis(redisUrl);
} else {
  // En desarrollo, sigue usando localhost o tu .env
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}

redisClient.on('connect', () => console.log('[Redis] ¡Conexión a Redis exitosa!'));
redisClient.on('error', err => console.error('[Redis] Error de conexión:', err));

module.exports = redisClient;