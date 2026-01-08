const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

// GET /api/vehicles/count - Get total count of available cars (must be before /:id)
router.get(
  '/count',
  vehicleController.getCarCount.bind(vehicleController)
);

// GET /api/vehicles/search - Search cars with comprehensive filters (must be before /:id)
router.get(
  '/search',
  vehicleController.searchCars.bind(vehicleController)
);

// GET /api/vehicles/filter-options - Get unique filter options from database (must be before /:id)
router.get(
  '/filter-options',
  vehicleController.getFilterOptions.bind(vehicleController)
);

// GET /api/vehicles - Get all cars with filters (must be before /:id)
router.get(
  '/',
  vehicleController.getAllCars.bind(vehicleController)
);

// POST /api/vehicles/lookup - Lookup vehicle from DVLA and create record
router.post(
  '/lookup',
  vehicleController.constructor.lookupValidationRules(),
  vehicleController.lookupAndCreateVehicle.bind(vehicleController)
);

// POST /api/vehicles/dvla-lookup - Lookup vehicle from DVLA without creating record
router.post(
  '/dvla-lookup',
  vehicleController.constructor.validateRegistrationRules(),
  vehicleController.dvlaLookup.bind(vehicleController)
);

// POST /api/vehicles/validate-registration - Validate registration format
router.post(
  '/validate-registration',
  vehicleController.constructor.validateRegistrationRules(),
  vehicleController.validateRegistration.bind(vehicleController)
);

// GET /api/vehicles/:id - Get a single car by ID (must be last)
router.get(
  '/:id',
  vehicleController.getCarById.bind(vehicleController)
);

module.exports = router;
