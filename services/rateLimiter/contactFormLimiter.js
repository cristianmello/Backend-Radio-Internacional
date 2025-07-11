// services/rateLimiter/contactFormLimiter.js

const redisClient = require('../redisclient');

const WINDOW_SECONDS = 24 * 60 * 60;
const MAX_REQUESTS = 4;

module.exports = {
    contactFormLimiter: async (req, res, next) => {
        try {
            // Para un formulario público, identificamos al usuario por su dirección IP.
            const identifier = req.ip;
            if (!identifier) {
                // Si no podemos obtener la IP, permitimos el paso para no bloquear solicitudes válidas.
                return next();
            }

            const key = `rl_contact_${identifier}`;
            const now = Math.floor(Date.now() / 1000);

            const data = await redisClient.hgetall(key);

            // Si no hay registro o la ventana de tiempo ya pasó, se crea una nueva.
            if (!data.count || (now - parseInt(data.firstAt, 10)) > WINDOW_SECONDS) {
                await redisClient
                    .multi()
                    .hset(key, { count: 1, firstAt: now })
                    .expire(key, WINDOW_SECONDS)
                    .exec();
                return next();
            }

            const count = parseInt(data.count, 10);
            if (count >= MAX_REQUESTS) {
                return res.status(429).json({
                    status: 'error',
                    message: 'Has enviado demasiados mensajes. Por favor, intenta de nuevo más tarde.',
                });
            }

            // Si aún no se alcanza el límite, se incrementa el contador.
            await redisClient.hincrby(key, 'count', 1);
            return next();

        } catch (err) {
            console.error('[ContactFormLimiter] Error:', err);
            // En caso de error con Redis, permitimos que la solicitud continúe para no afectar al usuario.
            next();
        }
    }
};