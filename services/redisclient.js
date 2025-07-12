/*
Funcional masomenos

// services/RedisClient.js
const Redis = require('ioredis');
// Forzando el redespliegue en Railway

//const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
const redisUrl = process.env.REDIS_URL

console.log('[DEBUG] Intentando conectar a Redis con esta URL:', redisUrl);

const redisClient = new Redis(redisUrl);

redisClient.on('connect', () => console.log('[Redis] Conectado a Redis:', redisUrl));
redisClient.on('error', err => console.error('[Redis] Error de conexión:', err));

module.exports = redisClient;
*/
// services/RedisClient.js
// services/RedisClient.js
const Redis = require('ioredis');
let redisClient;

if (process.env.NODE_ENV === 'production') {
  // --- MÉTODO CORRECTO Y SIMPLE ---
  // Conectamos usando el nombre del servicio como host.
  console.log('[DEBUG] Conectando a Redis por nombre de servicio... ', process.env.REDISPASSWORD);
  redisClient = new Redis({
    host: 'redis', // El nombre de tu servicio de Redis
    port: 6379,    // El puerto estándar de Redis
    password: process.env.REDISPASSWORD
  });
} else {
  // En desarrollo, usa tu configuración local
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}

redisClient.on('connect', () => console.log('[Redis] ¡Conexión a Redis exitosa!'));
redisClient.on('error', err => console.error('[Redis] Error de conexión:', err));

module.exports = redisClient;