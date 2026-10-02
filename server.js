'use strict';

/**
 * Vercel zero-config Express entry when the project Root Directory is the repo root.
 * Prefer Root Directory = `backend` (uses backend/src/server.js directly).
 */
module.exports = require('./backend/src/server');
