const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const TradeDealer = require('../models/TradeDealer');
const mongoose = require('mongoose');

/**
 * Protect routes - require authentication
 * Accepts both regular user JWT and trade dealer JWT
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

    // First try to find as regular user
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      req.user = user;
      return next();
    }

    // If not found as user, try trade dealer
    const dealer = await TradeDealer.findById(decoded.id);
    if (dealer) {
      // Create a user-like object from dealer so downstream controllers work
      req.user = {
        _id: dealer._id,
        id: dealer._id,
        email: dealer.email,
        name: dealer.businessName,
        isAdmin: false,
        role: 'trade',
        isEmailVerified: true, // dealers are pre-verified
        isTradeDealer: true,
        dealer: dealer
      };
      req.dealer = dealer;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'User not found'
    });

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
  // Admin and trade dealers bypass email verification requirement
  if (req.user?.isAdmin || req.user?.role === 'admin' || req.user?.isTradeDealer || req.user?.role === 'trade') {
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
  // Admin and trade dealers bypass email verification requirement
  if (req.user?.isAdmin || req.user?.role === 'admin' || req.user?.isTradeDealer || req.user?.role === 'trade') {
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

/**
 * Verify vehicle ownership - ensures user can only edit their own cars
 * Use after protect middleware
 */
const verifyVehicleOwnership = async (req, res, next) => {
  try {
    const Car = require('../models/Car');
    const vehicleId = req.params.id;
    
    console.log('🔐 [Ownership Check] Vehicle ID:', vehicleId);
    console.log('🔐 [Ownership Check] req.user exists:', !!req.user);
    console.log('🔐 [Ownership Check] req.dealer exists:', !!req.dealer);
    
    // Find the vehicle by advertId (UUID) OR MongoDB _id (ObjectId)
    // Try advertId first (most common case for edit URLs)
    let vehicle = await Car.findOne({ advertId: vehicleId });
    
    // If not found by advertId, try MongoDB _id (if valid ObjectId format)
    if (!vehicle && mongoose.Types.ObjectId.isValid(vehicleId)) {
      vehicle = await Car.findById(vehicleId);
    }
    
    if (!vehicle) {
      console.log('❌ [Ownership Check] Vehicle not found');
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    console.log('🔐 [Ownership Check] Vehicle found:', {
      _id: vehicle._id.toString(),
      advertId: vehicle.advertId,
      userId: vehicle.userId?.toString(),
      dealerId: vehicle.dealerId?.toString(),
      isDealerListing: vehicle.isDealerListing
    });
    
    // Admin can edit any car
    if (req.user?.isAdmin || req.user?.role === 'admin') {
      console.log('✅ [Ownership Check] Admin access granted');
      return next();
    }
    
    // For trade dealers - check if vehicle belongs to their dealer account
    if (req.user?.isTradeDealer || req.user?.role === 'trade') {
      const vehicleDealerId = vehicle.dealerId?._id?.toString() || vehicle.dealerId?.toString();
      const currentDealerId = req.dealer?._id?.toString() || req.user?.dealer?._id?.toString() || req.user?._id?.toString();
      
      console.log('🔍 [Ownership Check] Trade Dealer Check:', {
        vehicleDealerId,
        currentDealerId,
        match: vehicleDealerId === currentDealerId
      });
      
      if (vehicleDealerId && currentDealerId && vehicleDealerId === currentDealerId) {
        console.log('✅ [Ownership Check] Trade dealer owns this car');
        return next();
      }
      
      // Allow if car has no dealerId (new car being added by dealer)
      if (!vehicleDealerId) {
        console.log('✅ [Ownership Check] Car has no dealerId - allowing trade dealer to edit');
        return next();
      }
      
      console.log('❌ [Ownership Check] Trade dealer does not own this car');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this vehicle'
      });
    }
    
    // For regular users - check if vehicle belongs to them
    const vehicleUserId = vehicle.userId?._id?.toString() || vehicle.userId?.toString();
    const currentUserId = req.user?._id?.toString() || req.user?.id?.toString();
    
    console.log('🔍 [Ownership Check] Regular User Check:', {
      vehicleUserId,
      currentUserId,
      match: vehicleUserId === currentUserId
    });
    
    if (vehicleUserId && currentUserId && vehicleUserId === currentUserId) {
      console.log('✅ [Ownership Check] User owns this car');
      return next();
    }
    
    // Allow if car has no userId (new car being added)
    if (!vehicleUserId) {
      console.log('✅ [Ownership Check] Car has no userId - allowing user to edit');
      return next();
    }
    
    console.log('❌ [Ownership Check] User does not own this car');
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to edit this vehicle'
    });
    
  } catch (error) {
    console.error('❌ [Ownership Check] Exception:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying vehicle ownership',
      error: error.message
    });
  }
};

module.exports = { protect, optionalAuth, requireEmailVerified, requireEmailVerifiedForAccess, verifyVehicleOwnership };
