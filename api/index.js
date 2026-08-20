require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const connectDB = require('./_lib/db');
const authRoutes = require('./_routes/auth');
const videoRoutes = require('./_routes/videos');
const userRoutes = require('./_routes/user');
const errorHandler = require('./_middleware/errorHandler');

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

// Health check endpoint (instant response)
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  const isDbReady = mongoose.connection?.readyState === 1;
  if (!isDbReady) {
    connectDB().catch(() => {});
  }

  res.status(200).json({
    status: 'ok',
    app: 'Deceptor API',
    database: isDbReady ? 'connected' : 'connecting_or_idle',
    env: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

// Middleware for authenticated/database API routes
app.use(async (req, res, next) => {
  if (mongoose.connection?.readyState !== 1) {
    await connectDB().catch((e) => {
      console.warn('DB connect warning:', e.message);
    });
  }
  next();
});

// Mount routes
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

module.exports = app;
