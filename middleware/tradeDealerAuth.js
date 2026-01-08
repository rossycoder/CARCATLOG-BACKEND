const jwt = require('jsonwebtoken');
const TradeDealer = require('../models/TradeDealer');

/**
 * Middleware to authenticate trade dealer requests
 */
const authenticateTradeDealer = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a trade dealer token
    if (decoded.role !== 'trade_dealer' && decoded.role !== 'trade_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Trade dealer account required.'
      });
    }

    // Get dealer from database
    const dealer = await TradeDealer.findById(decoded.id);

    if (!dealer) {
      return res.status(401).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    // Check if dealer is active
    if (dealer.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${dealer.status}. Please contact support.`
      });
    }

    // Attach dealer to request
    req.dealer = dealer;
    req.dealerId = dealer._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Trade dealer auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if dealer has active subscription
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const TradeSubscription = require('../models/TradeSubscription');

    const subscription = await TradeSubscription.findActiveForDealer(req.dealerId);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    // Attach subscription to request
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('[Subscription Middleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription'
    });
  }
};

/**
 * Middleware to check if dealer can add more listings
 */
const checkListingLimit = async (req, res, next) => {
  try {
    if (!req.subscription) {
      return res.status(403).json({
        success: false,
        message: 'Subscription information not available'
      });
    }

    const canAdd = req.subscription.canAddListing();

    if (!canAdd.allowed) {
      return res.status(403).json({
        success: false,
        message: canAdd.reason,
        code: 'LISTING_LIMIT_REACHED',
        subscription: {
          listingsUsed: req.subscription.listingsUsed,
          listingsLimit: req.subscription.listingsLimit,
          planName: req.subscription.planId?.name
        }
      });
    }

    next();
  } catch (error) {
    console.error('Listing limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking listing limit'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalTradeDealerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'trade_dealer' || decoded.role === 'trade_admin') {
      const dealer = await TradeDealer.findById(decoded.id);
      if (dealer && dealer.status === 'active') {
        req.dealer = dealer;
        req.dealerId = dealer._id;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = {
  authenticateTradeDealer,
  requireActiveSubscription,
  checkListingLimit,
  optionalTradeDealerAuth
};
