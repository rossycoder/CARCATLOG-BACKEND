const express = require('express');
const router = express.Router();
const vanController = require('../controllers/vanController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');

// GET /api/vans - Get all vans with filtering
router.get('/', vanController.getVans);

// GET /api/vans/count - Get van count
router.get('/count', vanController.getVanCount);

// GET /api/vans/filter-options - Get filter options
router.get('/filter-options', vanController.getFilterOptions);

// GET /api/vans/search-filtered - Search vans with comprehensive filters
router.get('/search-filtered', vanController.searchVans);

// GET /api/vans/search - Search vans by postcode
router.get('/search', vanController.searchByPostcode);

// POST /api/vans/publish - Publish van for trade dealer (requires auth)
router.post('/publish', authenticateTradeDealer, vanController.publishVan);

// GET /api/vans/dealer - Get dealer's van inventory (requires auth)
router.get('/dealer', authenticateTradeDealer, vanController.getDealerVans);

// GET /api/vans/:id - Get single van by ID
router.get('/:id', vanController.getVanById);

// POST /api/vans - Create new van
router.post('/', vanController.createVan);

// PUT /api/vans/:id - Update van
router.put('/:id', vanController.updateVan);

// DELETE /api/vans/:id - Delete van
router.delete('/:id', vanController.deleteVan);

module.exports = router;
