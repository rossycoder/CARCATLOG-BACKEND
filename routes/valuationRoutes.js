const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');
const cachedValuationController = require('../controllers/cachedValuationController');

// GET /api/vehicle-valuation/cached/:vrm - Get cached valuation (no API calls)
router.get('/cached/:vrm', cachedValuationController.getCachedValuation);

// POST /api/vehicle-valuation/detailed - Get detailed valuation with DVLA data
// This must come BEFORE the root route to avoid being caught by the '/' matcher
router.post('/detailed', valuationController.getDetailedValuation);

// POST /api/vehicle-valuation - Get vehicle valuation (uses cache first)
router.post('/', valuationController.getValuation);

module.exports = router;
