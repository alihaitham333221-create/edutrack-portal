'use strict';

require('dotenv').config();

// Prevent unhandled promise rejections from crashing the serverless container
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

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

// ── Connect to MongoDB (non-blocking, safely caught) ─────────────────────────
connectDB().catch((err) => {
  console.error('[MongoDB Initial Connect]', err ? err.message : err);
});

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Normalize duplicate slashes in URL ────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.url && req.url.includes('//')) {
    req.url = req.url.replace(/\/{2,}/g, '/');
  }
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, Electron, server-to-server)
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) return cb(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    if (
      allowedOrigins.includes(cleanOrigin) ||
      allowedOrigins.includes('*') ||
      cleanOrigin.startsWith('http://localhost') ||
      cleanOrigin.startsWith('http://127.0.0.1') ||
      cleanOrigin.startsWith('vscode-') ||
      cleanOrigin.startsWith('file://') ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return cb(null, true);
    }

    logger.warn(`[CORS] Origin rejected: ${origin}`);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// ── Health check (standalone, fast response) ──────────────────────────────────
app.get(['/api/health', '/api/health/', '/health', '/health/', '/api', '/'], (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
  }
  res.status(200).json({
    status: 'ok',
    message: 'EduTrack Portal API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
  });
});

// ── Ensure DB Connection for API routes ───────────────────────────────────────
app.use(async (req, res, next) => {
  // Allow health check, root, and browser favicon without DB
  const p = req.path || '';
  if (
    p === '/api/health' ||
    p === '/health' ||
    p === '/' ||
    p === '/api' ||
    p === '/favicon.ico'
  ) {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      logger.error(`[DB Middleware] ${err.message}`);
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please check MONGODB_URI and ensure MongoDB Atlas Network Access has 0.0.0.0/0 allowed.',
    });
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
