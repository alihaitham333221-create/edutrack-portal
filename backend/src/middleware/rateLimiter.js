'use strict';

const rateLimit = require('express-rate-limit');

// Rate limiter for verification (login) attempts
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general public API endpoints
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sync endpoints
const syncLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 sync requests per minute
  message: {
    success: false,
    message: 'Sync rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  verifyLimiter,
  publicLimiter,
  syncLimiter,
};
