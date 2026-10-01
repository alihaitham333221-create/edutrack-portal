'use strict';

/**
 * Simple Logger Utility
 */
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err = '') => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  http: (msg) => console.log(`[HTTP] ${msg}`),
};

module.exports = logger;
