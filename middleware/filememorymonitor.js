// middleware/filememorymonitor.js  
module.exports = (req, res, next) => {
    const beforeMem = process.memoryUsage();

    res.on('finish', () => {
        const afterMem = process.memoryUsage();
        const diff = {
            rss: Math.round((afterMem.rss - beforeMem.rss) / 1024 / 1024),
            heapUsed: Math.round((afterMem.heapUsed - beforeMem.heapUsed) / 1024 / 1024)
        };

        if (req.file || req.files) {
            console.log(`[FILE-MEMORY]x ${req.method} ${req.originalUrl} - Memory diff: RSS +${diff.rss}MB, Heap +${diff.heapUsed}MB`);
        }
    });

    next();
};