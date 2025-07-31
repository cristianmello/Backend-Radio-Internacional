if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const { buildSitemap } = require('./generate-sitemap.cjs');

const database = require('./database/connection');
const getHomePageData = require('./controllers/pages/gethomepage');

require('./database/associations');

// Routers
const userRouter = require('./routes/user');
const articleRouter = require('./routes/article');
const categoryRouter = require('./routes/articlecategory');
const shortsRouter = require('./routes/short');
const audiosRouter = require('./routes/audio');
const sectionsRouter = require('./routes/sections');
const advertisementRoutes = require('./routes/advertisement');
const contactRouter = require('./routes/contact');

// Middleware de manejo de errores y autenticación
const errorHandler = require('./middleware/errorhandler');

console.log('API para Radio Internacional');

const app = express();

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

// 1) Security headers 
app.use(helmet());

// 2) CORS (solo desde tu frontend) 
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// 3) HTTP logger 
app.use((req, res, next) => {
  logger.info({
    message: 'HTTP Request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  });
  next();
});

// 4) Response compression 
app.use(compression());

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '6mb' })(req, res, next);
});


// 5) Body parsers con size limit 
app.use(express.urlencoded({ limit: '6mb', extended: true }));
app.disable('x-powered-by');

// 7) Cookie parser + CSRF
app.use(cookieParser());

// 8) Request ID for logs
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// 9) Routes
app.use('/api/users', userRouter);
app.use('/api/articles', articleRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/shorts', shortsRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/audios', audiosRouter);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/contacts', contactRouter);

app.get('/api/pages/home', getHomePageData);

app.post('/api/sitemap/regenerate', async (req, res) => {
  console.log('=== /api/sitemap/regenerate called ===');
  console.log('Headers:', req.headers);
  console.log('req.ip:', req.ip);

  const secret = req.headers['x-regeneration-secret'];
  if (secret !== process.env.SITEMAP_SECRET) {
    console.warn('[Sitemap] Unauthorized attempt with secret:', secret);
    return res.status(401).send('Unauthorized');
  }

  try {
    await buildSitemap();
    console.log('✅ Sitemap regenerado con éxito');
    return res
      .status(202)
      .send('Proceso de regeneración del sitemap iniciado.');
  } catch (err) {
    console.error('[Sitemap] Error al generar sitemap:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor', requestId: req.id });
  }
});


// 10) Handle 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada', requestId: req.id });
});

// 11) Global error handler
app.use(errorHandler);

// Start server & connect DB
(async () => {
  try {
    await database.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    app.listen(port, () => {
      console.log(`Servidor corriendo en puerto: ${port}`);
    });
  } catch (err) {
    console.error('Error al iniciar servidor:', err);
    process.exit(1);
  }
})();

// Captura de errores inesperados fuera de Express
process.on('unhandledRejection', err => {
  logger.error({ message: 'UNHANDLED REJECTION', error: err });
  process.exit(1);
});

process.on('uncaughtException', err => {
  logger.error({ message: 'UNCAUGHT EXCEPTION', error: err });
  process.exit(1);
});
