const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');

// GET /api/bikes - Get all bikes with filtering
router.get('/', bikeController.getBikes);

// GET /api/bikes/count - Get bike count
router.get('/count', bikeController.getBikeCount);

// GET /api/bikes/filter-options - Get filter options
router.get('/filter-options', bikeController.getFilterOptions);

// GET /api/bikes/search-filtered - Search bikes with comprehensive filters
router.get('/search-filtered', bikeController.searchBikes);

// GET /api/bikes/advert/:advertId - Get bike by advertId (for edit page)
router.get('/advert/:advertId', bikeController.getBikeByAdvertId);

// GET /api/bikes/basic-lookup/:registration - Basic bike lookup (FREE DVLA API first)
router.get('/basic-lookup/:registration', bikeController.basicBikeLookup);

// GET /api/bikes/complete-lookup/:registration - Complete bike lookup (MOT + History + Valuation)
router.get('/complete-lookup/:registration', bikeController.completeBikeLookup);

// GET /api/bikes/lookup/complete - Complete bike lookup with query params (for edit page)
router.get('/lookup/complete', bikeController.completeBikeLookup);

// GET /api/bikes/search - Search bikes by postcode
router.get('/search', bikeController.searchByPostcode);

// POST /api/bikes/publish - Publish bike for trade dealer (requires auth)
router.post('/publish', authenticateTradeDealer, bikeController.publishBike);

// POST /api/bikes/activate-from-payment - Activate bike after payment (fallback for webhook)
router.post('/activate-from-payment', bikeController.activateBikeFromPayment);

// GET /api/bikes/dealer - Get dealer's bike inventory (requires auth)
router.get('/dealer', authenticateTradeDealer, bikeController.getDealerBikes);

// GET /api/bikes/:id - Get single bike by ID
router.get('/:id', bikeController.getBikeById);

// POST /api/bikes - Create new bike
router.post('/', bikeController.createBike);

// PUT /api/bikes/:id - Update bike
router.put('/:id', bikeController.updateBike);

// PATCH /api/bikes/:id - Patch bike details (make, model, variant)
router.patch('/:id', bikeController.patchBikeDetails);

// DELETE /api/bikes/:id - Delete bike
router.delete('/:id', bikeController.deleteBike);

module.exports = router;
