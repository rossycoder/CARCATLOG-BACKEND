const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  checkEmail,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  googleCallback,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { verifyRecaptcha } = require('../middleware/recaptchaMiddleware');

// Public routes with reCAPTCHA protection (temporarily disabled for deployment)
router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword); // reCAPTCHA temporarily disabled for testing
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=google_auth_failed`
  }),
  googleCallback
);

// Facebook OAuth routes
router.get('/facebook', 
  passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/signin?error=facebook_auth_failed`
  }),
  googleCallback // Reuse the same callback handler
);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
