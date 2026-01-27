const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA v2 token
 */
const verifyRecaptcha = async (req, res, next) => {
  try {
    const { recaptchaToken } = req.body;

    // Skip verification in development if no token provided
    if (process.env.NODE_ENV === 'development' && !recaptchaToken) {
      console.log('⚠️ reCAPTCHA verification skipped in development');
      return next();
    }

    // Check if token exists
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification required'
      });
    }

    // Verify with Google
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('❌ RECAPTCHA_SECRET_KEY not configured');
      // Allow request to proceed if not configured (for backward compatibility)
      return next();
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;
    
    const response = await axios.post(verificationUrl, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken,
        remoteip: req.ip
      }
    });

    const { success, score, 'error-codes': errorCodes } = response.data;

    if (!success) {
      console.log('❌ reCAPTCHA verification failed:', errorCodes);
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        errors: errorCodes
      });
    }

    // For reCAPTCHA v2, success is boolean
    // For v3, you can check score (0.0 - 1.0, higher is better)
    if (score !== undefined && score < 0.5) {
      console.log('⚠️ Low reCAPTCHA score:', score);
      return res.status(400).json({
        success: false,
        message: 'Suspicious activity detected. Please try again.'
      });
    }

    console.log('✅ reCAPTCHA verified successfully');
    next();
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error.message);
    
    // Don't block the request if reCAPTCHA service is down
    // Log the error and proceed
    console.log('⚠️ Proceeding without reCAPTCHA verification due to service error');
    next();
  }
};

module.exports = { verifyRecaptcha };
