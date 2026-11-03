const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const attendanceRoutes = require('./routes/attendanceRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Security and utility middleware
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static frontend assets
app.use(express.static(path.resolve(__dirname, '../public')));

// Root health & metadata endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: config.projectMeta.version
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: config.projectMeta
  });
});

// API Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Fallback to index.html for SPA-style client routing if needed
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: `API route ${req.path} not found` });
  }
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
