const express = require('express');
const router = express.Router();
const tradeInventoryController = require('../controllers/tradeInventoryController');
const {
  authenticateTradeDealer,
  requireActiveSubscription,
  checkListingLimit
} = require('../middleware/tradeDealerAuth');
const {
  validateVehicleData,
  preventInjection,
  rateLimitCheck
} = require('../middleware/inputValidation');

// Apply security middleware to all routes
router.use(preventInjection);
router.use(rateLimitCheck(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// All routes require authentication
router.use(authenticateTradeDealer);

// Publish vehicle from sell flow (bypasses payment and subscription check)
// IMPORTANT: This route MUST be before requireActiveSubscription middleware
// NOTE: No validateVehicleData middleware here - publish endpoint has custom validation
router.post('/publish', (req, res, next) => {
  console.log('[Trade Routes] /publish route hit - bypassing subscription check');
  next();
}, tradeInventoryController.publishVehicle);

// Get inventory and stats - require active subscription
router.get('/', requireActiveSubscription, tradeInventoryController.getInventory);
router.get('/stats', requireActiveSubscription, tradeInventoryController.getStats);

// CRUD operations - require active subscription
router.get('/:id', requireActiveSubscription, tradeInventoryController.getVehicle);
router.post('/', requireActiveSubscription, checkListingLimit, validateVehicleData, tradeInventoryController.createVehicle);
router.put('/:id', requireActiveSubscription, validateVehicleData, tradeInventoryController.updateVehicle);
router.delete('/:id', requireActiveSubscription, tradeInventoryController.deleteVehicle);

// Mark as sold - require active subscription
router.patch('/:id/sold', requireActiveSubscription, tradeInventoryController.markAsSold);

module.exports = router;
