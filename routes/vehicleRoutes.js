const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { validateAndNormalizeVehicle, checkDuplicateRegistration } = require('../middleware/vehicleValidation');
const { protect } = require('../middleware/authMiddleware');

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

// GET /api/vehicles/basic-lookup/:registration - Basic vehicle lookup for CarFinder (cheap API)
router.get(
  '/basic-lookup/:registration',
  vehicleController.basicVehicleLookup.bind(vehicleController)
);

// GET /api/vehicles/enhanced-lookup/:registration - Enhanced vehicle lookup with both APIs
router.get(
  '/enhanced-lookup/:registration',
  vehicleController.enhancedVehicleLookup.bind(vehicleController)
);

// GET /api/vehicles/my-listings - Get user's listings (requires auth, must be before /:id)
router.get(
  '/my-listings',
  protect,
  vehicleController.getMyListings.bind(vehicleController)
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
  checkDuplicateRegistration,
  validateAndNormalizeVehicle,
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

// PATCH /api/vehicles/:id/status - Update vehicle status (requires auth)
router.patch(
  '/:id/status',
  protect,
  vehicleController.updateVehicleStatus.bind(vehicleController)
);

// DELETE /api/vehicles/:id - Delete vehicle (requires auth)
router.delete(
  '/:id',
  protect,
  vehicleController.deleteVehicle.bind(vehicleController)
);

// GET /api/vehicles/:id - Get a single car by ID (must be last)
router.get(
  '/:id',
  vehicleController.getCarById.bind(vehicleController)
);

module.exports = router;
