// middleware/memorymonitor.js  
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    const memUsage = process.memoryUsage();

    // Convertir bytes a MB para mejor legibilidad  
    const memoryInfo = {
        rss: Math.round(memUsage.rss / 1024 / 1024), // Memoria física total  
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // Heap total  
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // Heap usado  
        external: Math.round(memUsage.external / 1024 / 1024), // Memoria externa  
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // Array buffers  
    };

    console.log(`[MEMORY] ${req.method} ${req.originalUrl} - RSS: ${memoryInfo.rss}MB, Heap: ${memoryInfo.heapUsed}/${memoryInfo.heapTotal}MB`);

    // También puedes usar el logger existente  
    logger.info({
        message: 'Memory Usage',
        method: req.method,
        url: req.originalUrl,
        memory: memoryInfo,
        requestId: req.id
    });

    next();
};