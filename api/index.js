const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Direct test routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Deceptor Serverless API is ACTIVE',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Deceptor Serverless API is ACTIVE',
    timestamp: new Date().toISOString(),
  });
});

// Import and mount core routes inside try/catch so any DB/route error is safely caught
try {
  const authRoutes = require('./routes/auth');
  const videoRoutes = require('./routes/videos');
  const userRoutes = require('./routes/user');

  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  app.use('/api/videos', videoRoutes);
  app.use('/videos', videoRoutes);

  app.use('/api/user', userRoutes);
  app.use('/user', userRoutes);
} catch (loadError) {
  console.error('Route mount error:', loadError);
  app.use((req, res) => {
    res.status(500).json({
      success: false,
      message: 'Module loading error: ' + loadError.message,
      stack: loadError.stack,
    });
  });
}

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on serverless API.` });
});

module.exports = app;
