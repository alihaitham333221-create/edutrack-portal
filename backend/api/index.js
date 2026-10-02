'use strict';

/**
 * Vercel Serverless Function entry point for Express backend.
 * Vercel automatically routes requests through this handler.
 */
const app = require('../src/server');

module.exports = app;
