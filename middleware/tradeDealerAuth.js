const jwt = require('jsonwebtoken');
const TradeDealer = require('../models/TradeDealer');

/**
 * Middleware to authenticate trade dealer requests
 */
const authenticateTradeDealer = async (req, res, next) => {
  try {
    console.log('\n🔐 [Auth Middleware] Starting authentication...');
    
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ [Auth Middleware] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('✅ [Auth Middleware] Token found, verifying...');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [Auth Middleware] Token verified');
    console.log('   Decoded ID:', decoded.id);
    console.log('   Decoded Role:', decoded.role);

    // Check if it's a trade dealer token
    if (decoded.role !== 'trade_dealer' && decoded.role !== 'trade_admin') {
      console.log('❌ [Auth Middleware] Wrong role:', decoded.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Trade dealer account required.'
      });
    }

    console.log('🔍 [Auth Middleware] Looking for dealer in database...');
    console.log('   Dealer ID:', decoded.id);

    // Get dealer from database
    const dealer = await TradeDealer.findById(decoded.id);

    if (!dealer) {
      console.log('❌ [Auth Middleware] Dealer not found in database!');
      console.log('   Searched for ID:', decoded.id);
      console.log('   This means the JWT token has an invalid dealer ID');
      return res.status(401).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    console.log('✅ [Auth Middleware] Dealer found in database');
    console.log('   Email:', dealer.email);
    console.log('   Status:', dealer.status);

    // Check if dealer is active
    if (dealer.status !== 'active') {
      console.log(`❌ [Auth Middleware] Dealer status is "${dealer.status}" (needs to be "active")`);
      return res.status(403).json({
        success: false,
        message: `Account is ${dealer.status}. Please contact support.`
      });
    }

    console.log('✅ [Auth Middleware] All checks passed!');
    console.log('   Attaching dealer to request...\n');

    // Attach dealer to request
    req.dealer = dealer;
    req.dealerId = dealer._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ [Auth Middleware] Invalid JWT token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      console.log('❌ [Auth Middleware] JWT token expired');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('❌ [Auth Middleware] Unexpected error:', error);
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
        message: 'Subscription information not available',
        code: 'NO_SUBSCRIPTION'
      });
    }

    const canAdd = req.subscription.canAddListing();

    if (!canAdd.allowed) {
      const SubscriptionPlan = require('../models/SubscriptionPlan');
      const plan = await SubscriptionPlan.findById(req.subscription.planId);
      
      const planName = plan?.name || 'current';
      const limit = req.subscription.listingsLimit;
      
      return res.status(403).json({
        success: false,
        message: `You have reached your listing limit of ${limit} vehicles for your ${planName} subscription. Please upgrade your plan to add more vehicles.`,
        code: 'LISTING_LIMIT_REACHED',
        subscription: {
          listingsUsed: req.subscription.listingsUsed,
          listingsLimit: req.subscription.listingsLimit,
          planName: planName,
          usagePercentage: req.subscription.usagePercentage
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
