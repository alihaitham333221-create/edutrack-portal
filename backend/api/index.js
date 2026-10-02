'use strict';

/**
 * Vercel serverless entry: all traffic is rewritten here (see vercel.json).
 * Export the Express app so @vercel/node can serve every route (e.g. /api/health).
 */
const app = require('../src/server');

module.exports = app;
