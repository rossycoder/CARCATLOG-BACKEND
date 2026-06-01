const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Require email verification - use after protect middleware
 * Blocks unverified users from selling/listing vehicles
 */
const requireEmailVerified = (req, res, next) => {
  // Admin users bypass email verification requirement
  if (req.user?.isAdmin || req.user?.role === 'admin') {
    return next();
  }

  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before listing a vehicle.',
      requiresVerification: true
    });
  }

  next();
};

/**
 * Require email verification for general website access
 * Blocks unverified users from most website features except basic browsing
 */
const requireEmailVerifiedForAccess = (req, res, next) => {
  // Admin users bypass email verification requirement
  if (req.user?.isAdmin || req.user?.role === 'admin') {
    return next();
  }

  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature.',
      requiresVerification: true,
      redirectTo: '/verify-email-required'
    });
  }

  next();
};

module.exports = { protect };

/**
 * Optional auth - sets req.user if token is valid, but doesn't block if no token
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(); // No token - continue without user
  }

  try {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Invalid token - continue without user
  }

  next();
};

module.exports = { protect, optionalAuth, requireEmailVerified, requireEmailVerifiedForAccess };
