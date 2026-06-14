const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');

// Apply authentication middleware to all feed routes
router.use(authenticateTradeDealer);

// Test feed connection
router.post('/test', feedController.testFeed);

// Import feed
router.post('/import', feedController.importFeed);

// Get dealer feeds
router.get('/', feedController.getDealerFeeds);

// Update feed settings
router.put('/:feedId', feedController.updateFeed);

// Delete feed
router.delete('/:feedId', feedController.deleteFeed);

// Get feed logs
router.get('/logs', feedController.getFeedLogs);

// Manually trigger feed sync
router.post('/:feedId/sync', feedController.syncFeed);

module.exports = router;
