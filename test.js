const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');

const redisClient = new Redis({ url: 'redis://localhost:6379' });

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis conectado');
});

const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'test_rate',
  points: 5,
  duration: 60,
});

(async () => {
  const testKey = 'prueba_redis';
  console.log('🚀 Iniciando test...');

  for (let i = 1; i <= 10; i++) {
    const start = Date.now();
    try {
      await limiter.consume(testKey);
      console.log(`✅ Intento ${i} PERMITIDO - Tiempo: ${Date.now() - start}ms`);
    } catch (rej) {
      console.warn(`🚫 Intento ${i} BLOQUEADO - Esperar ${Math.ceil(rej.msBeforeNext / 1000)}s - Tiempo: ${Date.now() - start}ms`);
    }
  }

  redisClient.quit();
})();
