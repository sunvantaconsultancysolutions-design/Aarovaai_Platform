require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const topicRoutes = require('./routes/topic.routes');
const questionRoutes = require('./routes/question.routes');
const testRoutes = require('./routes/test.routes');
const progressRoutes = require('./routes/progress.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY & LOGGING ──
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend to load Google Fonts etc.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));

// ── CORS ──
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'null', // for file:// protocol during dev
  process.env.FRONTEND_URL, // custom domain from env
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any Railway deployment domain
    if (/\.railway\.app$/.test(origin)) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// ── BODY PARSING ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── SERVE FRONTEND STATIC FILES ──
app.use(express.static(path.join(__dirname, '..')));

// ── API ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api', topicRoutes);
app.use('/api', questionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api', dashboardRoutes);

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'AarovaaiAI Backend' });
});

// ── ROOT → Login page ──
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ── 404 for API routes ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── Catch-all → serve index or login ──
app.use((req, res) => {
  const file = path.join(__dirname, '..', req.path);
  const fs = require('fs');
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.sendFile(file);
  } else {
    res.redirect('/login.html');
  }
});

// ── ERROR HANDLER ──
app.use(errorHandler);

// ── START ──
app.listen(PORT, () => {
  console.log(`\n🚀 AarovaaiAI Backend running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${path.join(__dirname, '..')}`);
  console.log(`🔑 JWT Auth: enabled`);
  console.log(`📊 Storage: JSON files\n`);
});

module.exports = app;
