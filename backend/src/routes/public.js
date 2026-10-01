'use strict';

const express = require('express');
const router = express.Router();
const { verifyStudent, getStudentResults } = require('../controllers/publicController');
const jwtAuth = require('../middleware/jwtAuth');
const { verifyLimiter, publicLimiter } = require('../middleware/rateLimiter');

// Public route: Parent Login/Verify
router.post('/verify', verifyLimiter, verifyStudent);

// Protected routes: Parent viewing student data
router.get('/student/:barcode/results', publicLimiter, jwtAuth, getStudentResults);

module.exports = router;
