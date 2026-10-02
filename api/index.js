'use strict';

/**
 * Fallback entry when the Vercel project Root Directory is the repo root (not `backend/`).
 * Set Root Directory to `backend` in Vercel — preferred — and this file is ignored.
 */
module.exports = require('../backend/src/server');
