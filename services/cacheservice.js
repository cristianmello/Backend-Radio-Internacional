// services/cacheService.js
const redisClient = require('./redisclient');

const DEFAULT_EXPIRATION = 300; // 5 minutos

const getOrSetCache = async (key, fetchCallback, expiration = DEFAULT_EXPIRATION) => {
    const cached = await redisClient.get(key);
    if (cached) {
        return JSON.parse(cached);
    }

    const freshData = await fetchCallback();

    await redisClient.setex(key, expiration, JSON.stringify(freshData));
    return freshData;
};

module.exports = { getOrSetCache };
