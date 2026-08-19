require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./lib/db');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/user');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (e) {
    console.error('Database connection error in request:', e.message);
  }
  next();
});

// Health check on all variations
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({
    status: 'ok',
    app: 'Deceptor API',
    env: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes for both /api-prefixed and direct routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/videos', videoRoutes);
app.use('/videos', videoRoutes);

app.use('/api/user', userRoutes);
app.use('/user', userRoutes);

// Public video link resolution
app.use(['/api/v', '/v'], (req, res, next) => {
  const shortId = req.params[0] ? req.params[0].replace('/', '') : req.path.replace('/', '');
  req.url = `/public/${shortId}`;
  videoRoutes(req, res, next);
});

// Error Handler
app.use(errorHandler);

// Standalone mode (local execution)
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Deceptor API running on http://localhost:${PORT}`);
    });
  });
}

module.exports = (req, res) => {
  return app(req, res);
};
