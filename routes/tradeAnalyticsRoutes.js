const express = require('express');
const router = express.Router();
const tradeAnalyticsController = require('../controllers/tradeAnalyticsController');
const { authenticateTradeDealer, requireActiveSubscription } = require('../middleware/tradeDealerAuth');

// All routes require authentication
router.use(authenticateTradeDealer);

// Get analytics data - require active subscription
router.get('/', requireActiveSubscription, tradeAnalyticsController.getAnalytics);

module.exports = router;
