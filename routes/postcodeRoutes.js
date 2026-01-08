const express = require('express');
const router = express.Router();
const postcodeController = require('../controllers/postcodeController');

/**
 * @route   GET /api/postcode/search
 * @desc    Search for cars by postcode and radius
 * @query   postcode - UK postcode (required)
 * @query   radius - Search radius in miles (optional, default: 25)
 * @access  Public
 */
router.get('/search', postcodeController.searchByPostcode);

module.exports = router;
