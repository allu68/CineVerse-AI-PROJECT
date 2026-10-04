require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const moviesRouter = require('./routes/movies');
const searchRouter = require('./routes/search');
const actorsRouter = require('./routes/actors');
const recommendationsRouter = require('./routes/recommendations');
const trendingRouter = require('./routes/trending');
const discoverRouter = require('./routes/discover');
const aiRouter = require('./routes/ai');

const app = express();

/* ──────────────────────────────────────────────────────────────
   ✅ TRUST PROXY FIX FOR RENDER
────────────────────────────────────────────────────────────── */
app.set('trust proxy', 1);

/* ──────────────────────────────────────────────────────────────
   Security & Performance
────────────────────────────────────────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(compression());

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

/* ──────────────────────────────────────────────────────────────
   ✅ CORS FIX
────────────────────────────────────────────────────────────── */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ──────────────────────────────────────────────────────────────
   Rate Limiter
────────────────────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: 'Too many requests, please try again later.',
  },
});

app.use('/api/', limiter);

/* ──────────────────────────────────────────────────────────────
   Body Parsers
────────────────────────────────────────────────────────────── */
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ──────────────────────────────────────────────────────────────
   Routes
────────────────────────────────────────────────────────────── */
app.use('/api/movies', moviesRouter);

app.use('/api/search', searchRouter);

app.use('/api/actors', actorsRouter);

app.use('/api/recommendations', recommendationsRouter);

app.use('/api/trending', trendingRouter);

app.use('/api/discover', discoverRouter);

app.use('/api/ai', aiRouter);

/* ──────────────────────────────────────────────────────────────
   Health Check
────────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: '🎬 CineVerse AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* ──────────────────────────────────────────────────────────────
   Root Route
────────────────────────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎬 CineVerse AI Backend Running',
  });
});

/* ──────────────────────────────────────────────────────────────
   404 Handler
────────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

/* ──────────────────────────────────────────────────────────────
   Global Error Handler
────────────────────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('\n❌ SERVER ERROR:\n', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',

    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
});

module.exports = app;