'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const compression = require('compression');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, Electron, server-to-server)
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) return cb(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('vscode-') ||
      origin.startsWith('file://')
    ) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── NoSQL injection prevention ────────────────────────────────────────────────
app.use(mongoSanitize());

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: { write: msg => logger.http(msg.trim()) } },
));

// ── Health check (standalone, does not require DB) ───────────────────────────
app.get(['/api/health', '/api/health/', '/health', '/health/', '/api', '/'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Ensure DB Connection for API routes ───────────────────────────────────────
app.use(async (_req, _res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      logger.error(`[DB Middleware] ${err.message}`);
    }
  }
  next();
});

// ── Routes (support both /api and direct paths) ────────────────────────────────
app.use('/api/public', publicRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/public',     publicRoutes);
app.use('/admin',      adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

module.exports = app;
