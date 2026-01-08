const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');

// GET /api/bikes - Get all bikes with filtering
router.get('/', bikeController.getBikes);

// GET /api/bikes/count - Get bike count
router.get('/count', bikeController.getBikeCount);

// GET /api/bikes/search - Search bikes by postcode
router.get('/search', bikeController.searchByPostcode);

// POST /api/bikes/publish - Publish bike for trade dealer (requires auth)
router.post('/publish', authenticateTradeDealer, bikeController.publishBike);

// GET /api/bikes/dealer - Get dealer's bike inventory (requires auth)
router.get('/dealer', authenticateTradeDealer, bikeController.getDealerBikes);

// GET /api/bikes/:id - Get single bike by ID
router.get('/:id', bikeController.getBikeById);

// POST /api/bikes - Create new bike
router.post('/', bikeController.createBike);

// PUT /api/bikes/:id - Update bike
router.put('/:id', bikeController.updateBike);

// DELETE /api/bikes/:id - Delete bike
router.delete('/:id', bikeController.deleteBike);

module.exports = router;
