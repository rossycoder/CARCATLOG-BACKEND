const express = require('express');
const router = express.Router();
const tradeSubscriptionController = require('../controllers/tradeSubscriptionController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');

// Public routes
router.get('/plans', tradeSubscriptionController.getPlans);

// Webhook (no auth - verified by Stripe signature)
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), tradeSubscriptionController.handleWebhook);

// Protected routes
router.use(authenticateTradeDealer);

router.get('/current', tradeSubscriptionController.getCurrentSubscription);
router.post('/create-checkout-session', tradeSubscriptionController.createCheckoutSession);
router.post('/verify-payment', tradeSubscriptionController.verifyPayment);
router.post('/create', tradeSubscriptionController.createSubscription);
router.post('/cancel', tradeSubscriptionController.cancelSubscription);
router.post('/reactivate', tradeSubscriptionController.reactivateSubscription);

module.exports = router;
