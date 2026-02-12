const express = require('express');
const router = express.Router();
const passport = require('passport');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Protect all admin routes
router.use(passport.authenticate('jwt', { session: false }));
router.use(adminAuth);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin only
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/listings
 * @desc    Get all listings with pagination and filters
 * @access  Admin only
 */
router.get('/listings', adminController.getAllListings);

/**
 * @route   GET /api/admin/listings/:id
 * @desc    Get single listing details
 * @access  Admin only
 */
router.get('/listings/:id', adminController.getListingDetails);

/**
 * @route   PUT /api/admin/listings/:id
 * @desc    Update any listing
 * @access  Admin only
 */
router.put('/listings/:id', adminController.updateListing);

/**
 * @route   DELETE /api/admin/listings/:id
 * @desc    Delete any listing
 * @access  Admin only
 */
router.delete('/listings/:id', adminController.deleteListing);

module.exports = router;
