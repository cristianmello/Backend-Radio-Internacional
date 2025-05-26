require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const database = require('./database/connection');
require('./database/associations');

// Routers
const userRouter = require('./routes/user')
const articleRouter = require('./routes/article')
const categoryRouter = require('./routes/articlecategory')


// Middleware de manejo de errores y autenticación
const errorHandler = require('./middleware/errorhandler');

console.log('API para Radio Internacional');

const app = express();
const port = process.env.PORT || 3000;

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

// 5) Body parsers con size limit 
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.disable('x-powered-by');

// 6) Rate limiter global 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiadas solicitudes, inténtalo más tarde.' }
});
app.use('/api/', apiLimiter);

// 7) Cookie parser + CSRF
app.use(cookieParser());
/*
app.use(csrf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' } }));
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    secure: process.env.NODE_ENV === 'production', sameSite: 'strict'
  });
  next();
});
*/

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


// 10) Handle 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada', requestId: req.id });
});

// 11) Global error handler
app.use(errorHandler);

// Start server & connect DB
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
  logger.error({ message: 'UNHANDLED REJECTION 💥', error: err });
  process.exit(1);
});

process.on('uncaughtException', err => {
  logger.error({ message: 'UNCAUGHT EXCEPTION 💥', error: err });
  process.exit(1);
});
