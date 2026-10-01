'use strict';

const express = require('express');
const router = express.Router();
const { syncData, getAccessCodes, updateAccessCode } = require('../controllers/adminController');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { syncLimiter } = require('../middleware/rateLimiter');

// All admin routes require API Key
router.use(apiKeyAuth);

// Data sync
router.post('/sync', syncLimiter, syncData);

// Access code queries and updates
router.get('/students/access-codes', getAccessCodes);
router.put('/students/:barcode/access-code', updateAccessCode);

module.exports = router;
