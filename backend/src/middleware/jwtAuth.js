'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token for parent public requests
 */
const jwtAuth = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach student barcode to request object
      req.studentBarcode = decoded.barcode;

      // Verify that the requested param (if barcode param is present) matches JWT barcode
      if (req.params.barcode && req.params.barcode !== decoded.barcode) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only access data for your authenticated student.',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided.',
    });
  }
};

module.exports = jwtAuth;
