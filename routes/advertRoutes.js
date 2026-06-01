const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');
const { optionalTradeDealerAuth } = require('../middleware/tradeDealerAuth');
const { optionalAuth, protect, requireEmailVerifiedForAccess } = require('../middleware/authMiddleware');

// POST /api/adverts - Create a new advert (requires email verification)
router.post('/', protect, requireEmailVerifiedForAccess, optionalTradeDealerAuth, advertController.createAdvert);

// GET /api/adverts/:advertId - Get advert by ID
router.get('/:advertId', advertController.getAdvert);

// PUT /api/adverts/:advertId - Update advert
router.put('/:advertId', protect, requireEmailVerifiedForAccess, advertController.updateAdvert);

// POST /api/adverts/:advertId/publish - Publish advert
router.post('/:advertId/publish', protect, requireEmailVerifiedForAccess, advertController.publishAdvert);

module.exports = router;
