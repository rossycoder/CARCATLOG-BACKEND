const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');
const { optionalTradeDealerAuth } = require('../middleware/tradeDealerAuth');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /api/adverts - Create a new advert (with optional auth for both regular users and trade dealers)
router.post('/', optionalAuth, optionalTradeDealerAuth, advertController.createAdvert);

// GET /api/adverts/:advertId - Get advert by ID
router.get('/:advertId', advertController.getAdvert);

// PUT /api/adverts/:advertId - Update advert
router.put('/:advertId', advertController.updateAdvert);

// POST /api/adverts/:advertId/publish - Publish advert
router.post('/:advertId/publish', advertController.publishAdvert);

module.exports = router;
