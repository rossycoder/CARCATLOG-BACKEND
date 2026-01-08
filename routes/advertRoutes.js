const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');

// POST /api/adverts - Create a new advert
router.post('/', advertController.createAdvert);

// GET /api/adverts/:advertId - Get advert by ID
router.get('/:advertId', advertController.getAdvert);

// PUT /api/adverts/:advertId - Update advert
router.put('/:advertId', advertController.updateAdvert);

// POST /api/adverts/:advertId/publish - Publish advert
router.post('/:advertId/publish', advertController.publishAdvert);

module.exports = router;
