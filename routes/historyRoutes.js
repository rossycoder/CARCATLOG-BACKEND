const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const vehicleHistoryController = require('../controllers/vehicleHistoryController');

// GET /api/vehicle-history/cached/:vrm - Get cached history (no API calls)
router.get('/cached/:vrm', vehicleHistoryController.getCachedVehicleHistory);

// POST /api/vehicle-history/check - Perform new history check (admin only)
router.post('/check', historyController.checkVehicleHistory);

// GET /api/vehicle-history/mot/:vrm - Get MOT history for a vehicle
router.get('/mot/:vrm', historyController.getMOTHistory);

// GET /api/vehicle-history/registration/:vrm - Get vehicle registration details
router.get('/registration/:vrm', historyController.getVehicleRegistration);

// GET /api/vehicle-history/specs/:vrm - Get vehicle specifications
router.get('/specs/:vrm', historyController.getVehicleSpecs);

// GET /api/vehicle-history/mileage/:vrm - Get mileage history
router.get('/mileage/:vrm', historyController.getMileageHistory);

// GET /api/vehicle-history/comprehensive/:vrm - Get all vehicle data
router.get('/comprehensive/:vrm', historyController.getComprehensiveData);

// GET /api/vehicle-history/:vrm - Get cached history for a vehicle (must be last)
router.get('/:vrm', historyController.getVehicleHistory);

module.exports = router;
