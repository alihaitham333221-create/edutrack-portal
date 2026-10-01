'use strict';

/**
 * Middleware to verify Admin API key for sync endpoints
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: ADMIN_API_KEY is missing.',
    });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing API key.',
    });
  }

  next();
};

module.exports = apiKeyAuth;
