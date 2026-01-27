const express = require('express');
const router = express.Router();
const multer = require('multer');
const tradeDealerController = require('../controllers/tradeDealerController');
const { authenticateTradeDealer } = require('../middleware/tradeDealerAuth');
const {
  validateTradeDealerRegistration,
  validateLoginCredentials,
  preventInjection,
  rateLimitCheck
} = require('../middleware/inputValidation');
const { verifyRecaptcha } = require('../middleware/recaptchaMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Apply security middleware to all routes
router.use(preventInjection);

// Public routes with rate limiting and reCAPTCHA protection
// Increased limits for development/testing
router.post('/register', rateLimitCheck(20, 60 * 60 * 1000), verifyRecaptcha, upload.single('logo'), validateTradeDealerRegistration, tradeDealerController.register);
router.post('/login', rateLimitCheck(20, 15 * 60 * 1000), verifyRecaptcha, validateLoginCredentials, tradeDealerController.login);
router.post('/verify-email', rateLimitCheck(10, 15 * 60 * 1000), tradeDealerController.verifyEmail);
router.post('/forgot-password', rateLimitCheck(5, 60 * 60 * 1000), verifyRecaptcha, tradeDealerController.forgotPassword);
router.post('/reset-password', rateLimitCheck(5, 60 * 60 * 1000), tradeDealerController.resetPassword);

// Protected routes
router.use(authenticateTradeDealer); // All routes below require authentication

router.get('/me', tradeDealerController.getMe);
router.post('/logout', tradeDealerController.logout);

module.exports = router;
