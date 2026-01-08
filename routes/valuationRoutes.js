const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');

// POST /api/vehicle-valuation/detailed - Get detailed valuation with DVLA data
// This must come BEFORE the root route to avoid being caught by the '/' matcher
router.post('/detailed', valuationController.getDetailedValuation);

// POST /api/vehicle-valuation - Get vehicle valuation
router.post('/', valuationController.getValuation);

module.exports = router;
