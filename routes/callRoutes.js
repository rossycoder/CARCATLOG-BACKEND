const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const callController = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

// Rate limit: max 10 session requests per user per hour
const sessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.socket.remoteAddress,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many call requests. Please try again later.' }
});

// Public — Twilio webhook (no auth, Twilio signs requests)
router.post('/webhook/voice', callController.voiceWebhook);
router.post('/webhook/whisper', callController.whisperWebhook);
router.post('/webhook/call-status', callController.callStatusWebhook);

// Authenticated buyer routes
router.post('/create-session', protect, sessionLimiter, callController.createSession);
router.get('/session/:listingId', protect, callController.getSession);

// Admin routes
router.get('/pool/status', protect, adminAuth, callController.poolStatus);
router.post('/pool/add', protect, adminAuth, callController.addToPool);

module.exports = router;
