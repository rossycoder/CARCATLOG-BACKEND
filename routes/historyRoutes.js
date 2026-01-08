const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// POST /api/vehicle-history/check - Perform new history check
router.post('/check', historyController.checkVehicleHistory);

// GET /api/vehicle-history/mot/:vrm - Get MOT history for a vehicle (must come before /:vrm)
router.get('/mot/:vrm', historyController.getMOTHistory);

// GET /api/vehicle-history/:vrm - Get cached history for a vehicle
router.get('/:vrm', historyController.getVehicleHistory);

module.exports = router;
