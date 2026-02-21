const TradeDealer = require('../models/TradeDealer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

/**
 * Generate JWT token for trade dealer
 */
const generateToken = (dealer) => {
  return jwt.sign(
    {
      id: dealer._id,
      email: dealer.email,
      role: dealer.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Register new trade dealer
 * POST /api/trade/auth/register
 */
exports.register = async (req, res) => {
  try {
    const {
      businessName,
      tradingName,
      contactPerson,
      email,
      phone,
      password,
      businessAddress,
      businessRegistrationNumber,
      vatNumber
    } = req.body;

    // Validate required fields
    if (!businessName || !contactPerson || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if dealer already exists
    const existingDealer = await TradeDealer.findOne({ email: email.toLowerCase() });
    if (existingDealer) {
      return res.status(400).json({
        success: false,
        message: 'A dealer account with this email already exists'
      });
    }

    // Handle logo upload if present
    let logoUrl = null;
    if (req.file) {
      const cloudinary = require('../services/cloudinaryService');
      
      // Convert buffer to base64 data URI
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const uploadResult = await cloudinary.uploadImage(base64Image, {
        folder: 'dealer-logos',
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      // Check if upload was successful
      if (uploadResult.success && uploadResult.data) {
        logoUrl = uploadResult.data.url;
      } else {
        console.error('Cloudinary upload failed:', uploadResult.error);
        // Continue with registration even if logo upload fails
      }
    }

    // Parse businessAddress - handle both string and object formats
    let addressData = {};
    if (businessAddress) {
      if (typeof businessAddress === 'string') {
        // If it's a string, store it in the street field
        addressData = {
          street: businessAddress,
          city: '',
          postcode: '',
          country: 'United Kingdom'
        };
      } else {
        // If it's already an object, use it directly
        addressData = businessAddress;
      }
    }

    // Create dealer
    const dealer = new TradeDealer({
      businessName,
      tradingName,
      contactPerson,
      email: email.toLowerCase(),
      phone,
      password,
      businessAddress: addressData,
      businessRegistrationNumber,
      vatNumber,
      logo: logoUrl,
      status: 'pending' // Will be activated after email verification
    });

    // Generate email verification token
    const verificationToken = dealer.generateEmailVerificationToken();
    await dealer.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/trade/verify-email?token=${verificationToken}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
    .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
    .logo { max-width: 120px; height: auto; display: block; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
    </div>
    <div class="header">
      <h1>✅ Welcome to CarCatalog Trade!</h1>
      <p>Verify your email to get started</p>
    </div>
    <div class="content">
      <p>Hello ${dealer.contactPerson},</p>
      <p>Thank you for registering <strong>${dealer.businessName}</strong> as a trade dealer on CarCatalog.</p>
      <p>To complete your registration and start listing vehicles, please verify your email address:</p>
      <center>
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </center>
      <div class="info-box">
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>Click the button above to verify your email</li>
          <li>Choose your subscription plan</li>
          <li>Start listing vehicles immediately</li>
          <li>Access your dealer dashboard and analytics</li>
        </ul>
      </div>
      <p><strong>Link expires in 24 hours.</strong></p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
      <p>If you didn't create this account, please ignore this email.</p>
      <p>Best regards,<br>The CarCatalog Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
    
    await sendEmail(
      dealer.email,
      'Verify Your Trade Dealer Account - CarCatalog',
      emailHtml,
      emailHtml
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        email: dealer.email,
        logo: dealer.logo,
        status: dealer.status
      }
    });
  } catch (error) {
    console.error('Trade dealer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering dealer',
      error: error.message
    });
  }
};

/**
 * Verify email
 * POST /api/trade/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find dealer with this token
    const dealer = await TradeDealer.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!dealer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update dealer
    dealer.emailVerified = true;
    dealer.status = 'active';
    dealer.emailVerificationToken = undefined;
    dealer.emailVerificationExpires = undefined;
    await dealer.save();

    // Generate token
    const authToken = generateToken(dealer);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token: authToken,
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        email: dealer.email,
        status: dealer.status
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

/**
 * Login trade dealer
 * POST /api/trade/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find dealer and include password
    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!dealer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await dealer.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!dealer.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check account status
    if (dealer.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${dealer.status}. Please contact support.`,
        code: 'ACCOUNT_NOT_ACTIVE'
      });
    }

    // Update last login
    dealer.lastLoginAt = new Date();
    await dealer.save();

    // Generate token
    const token = generateToken(dealer);

    // Get subscription info
    const TradeSubscription = require('../models/TradeSubscription');
    const subscription = await TradeSubscription.findActiveForDealer(dealer._id);
    
    // CRITICAL: Sync listingsUsed with actual active cars count
    if (subscription) {
      await subscription.syncUsage();
      console.log(`[Trade Login] Synced subscription usage: ${subscription.listingsUsed} active listings`);
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        tradingName: dealer.tradingName,
        email: dealer.email,
        contactPerson: dealer.contactPerson,
        phone: dealer.phone,
        logo: dealer.logo,
        status: dealer.status,
        stats: dealer.stats
      },
      subscription: subscription ? {
        id: subscription._id,
        plan: subscription.planId ? {
          id: subscription.planId._id,
          name: subscription.planId.name,
          slug: subscription.planId.slug,
          price: subscription.planId.price,
          listingsLimit: subscription.planId.listingsLimit
        } : null,
        status: subscription.status,
        listingsUsed: subscription.listingsUsed,
        listingsLimit: subscription.listingsLimit,
        listingsAvailable: subscription.listingsAvailable,
        usagePercentage: subscription.usagePercentage,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: subscription.daysRemaining
      } : null
    });
  } catch (error) {
    console.error('Trade dealer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

/**
 * Get current dealer info
 * GET /api/trade/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const dealer = await TradeDealer.findById(req.dealerId);

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Get subscription info
    const TradeSubscription = require('../models/TradeSubscription');
    const subscription = await TradeSubscription.findActiveForDealer(dealer._id);
    
    // CRITICAL: Sync listingsUsed with actual active cars count
    if (subscription) {
      await subscription.syncUsage();
      console.log(`[Trade GetMe] Synced subscription usage: ${subscription.listingsUsed} active listings`);
    }

    res.json({
      success: true,
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        tradingName: dealer.tradingName,
        email: dealer.email,
        contactPerson: dealer.contactPerson,
        phone: dealer.phone,
        businessAddress: dealer.businessAddress,
        businessRegistrationNumber: dealer.businessRegistrationNumber,
        vatNumber: dealer.vatNumber,
        logo: dealer.logo,
        description: dealer.description,
        website: dealer.website,
        status: dealer.status,
        emailVerified: dealer.emailVerified,
        stats: dealer.stats,
        createdAt: dealer.createdAt,
        lastLoginAt: dealer.lastLoginAt
      },
      subscription: subscription ? {
        id: subscription._id,
        plan: subscription.planId ? {
          id: subscription.planId._id,
          name: subscription.planId.name,
          slug: subscription.planId.slug,
          price: subscription.planId.price,
          listingsLimit: subscription.planId.listingsLimit
        } : null,
        status: subscription.status,
        listingsUsed: subscription.listingsUsed,
        listingsLimit: subscription.listingsLimit,
        listingsAvailable: subscription.listingsAvailable,
        usagePercentage: subscription.usagePercentage,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: subscription.daysRemaining
      } : null
    });
  } catch (error) {
    console.error('Get dealer info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dealer information'
    });
  }
};

/**
 * Request password reset
 * POST /api/trade/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const dealer = await TradeDealer.findOne({ email: email.toLowerCase() });

    if (!dealer) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = dealer.generatePasswordResetToken();
    await dealer.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/trade/reset-password?token=${resetToken}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
    .logo-header { background: white; padding: 15px 20px; text-align: left; border-bottom: 2px solid #e0e0e0; }
    .logo { max-width: 120px; height: auto; display: block; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .warning-box { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <img src="https://res.cloudinary.com/dexgkptpg/image/upload/v1765219299/carcatalog/logo.jpg" alt="CarCatalog Logo" class="logo" />
    </div>
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
      <p>Reset your account password</p>
    </div>
    <div class="content">
      <p>Hello ${dealer.contactPerson},</p>
      <p>We received a request to reset the password for your trade dealer account at <strong>${dealer.businessName}</strong>.</p>
      <p>Click the button below to create a new password:</p>
      <center>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </center>
      <div class="warning-box">
        <p><strong>⚠️ Security Notice:</strong></p>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will remain unchanged</li>
        </ul>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
      <p>Best regards,<br>The CarCatalog Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} CarCatalog. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
    
    await sendEmail(
      dealer.email,
      'Password Reset Request - CarCatalog Trade',
      emailHtml,
      emailHtml
    );

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
};

/**
 * Reset password
 * POST /api/trade/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find dealer with this token
    const dealer = await TradeDealer.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!dealer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    dealer.password = password;
    dealer.passwordResetToken = undefined;
    dealer.passwordResetExpires = undefined;
    await dealer.save();

    // Generate new auth token
    const authToken = generateToken(dealer);

    res.json({
      success: true,
      message: 'Password reset successful',
      token: authToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

/**
 * Logout (client-side token removal)
 * POST /api/trade/auth/logout
 */
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
