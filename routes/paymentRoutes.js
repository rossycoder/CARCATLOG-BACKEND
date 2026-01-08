const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payments/create-checkout-session - Create Stripe checkout session
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// POST /api/payments/create-advert-checkout-session - Create Stripe checkout session for advertising packages
router.post('/create-advert-checkout-session', paymentController.createAdvertCheckoutSession);

// POST /api/payments/create-car-checkout-session - Create Stripe checkout session for car advertising packages (alias)
router.post('/create-car-checkout-session', paymentController.createAdvertCheckoutSession);

// POST /api/payments/create-bike-checkout-session - Create Stripe checkout session for bike advertising packages
router.post('/create-bike-checkout-session', paymentController.createBikeCheckoutSession);

// POST /api/payments/create-van-checkout-session - Create Stripe checkout session for van advertising packages
router.post('/create-van-checkout-session', paymentController.createVanCheckoutSession);

// POST /api/payments/webhook - Handle Stripe webhooks
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

// GET /api/payments/session/:sessionId - Get checkout session details
router.get('/session/:sessionId', paymentController.getSessionDetails);

// GET /api/payments/purchase/:sessionId - Get purchase details by session ID
router.get('/purchase/:sessionId', paymentController.getPurchaseDetails);

// POST /api/payments/create-credit-session - Create credit package checkout session
router.post('/create-credit-session', paymentController.createCreditCheckoutSession);

// GET /api/payments/credits - Get user credit balance (requires auth)
router.get('/credits', paymentController.getCreditBalance);

// POST /api/payments/use-credit - Use credit for vehicle check (requires auth)
router.post('/use-credit', paymentController.useCreditForCheck);

// POST /api/payments/refund - Create refund (admin only)
router.post('/refund', paymentController.createRefund);

module.exports = router;