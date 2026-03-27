const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Protect all admin routes with JWT authentication
router.use(protect);
// Then check if user is admin
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
 * @route   GET /api/admin/users
 * @desc    Get all users with their vehicle counts
 * @access  Admin only
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:userId/vehicles
 * @desc    Get all vehicles for a specific user
 * @access  Admin only
 */
router.get('/users/:userId/vehicles', adminController.getUserVehicles);

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

/**
 * @route   GET /api/admin/api-stats
 * @desc    Get API usage statistics
 * @access  Admin only
 */
router.get('/api-stats', adminController.getAPIStats);

/**
 * @route   GET /api/admin/vehicle-api/:vrm
 * @desc    Get API call summary for specific vehicle
 * @access  Admin only
 */
router.get('/vehicle-api/:vrm', adminController.getVehicleAPIStats);

/**
 * @route   GET /api/admin/excessive-api-calls
 * @desc    Find vehicles with excessive API calls
 * @access  Admin only
 */
router.get('/excessive-api-calls', adminController.getExcessiveAPICalls);

/**
 * @route   POST /api/admin/vans/:id/activate
 * @desc    Manually activate a van
 * @access  Admin only
 */
router.post('/vans/:id/activate', adminController.activateVan);

/**
 * @route   GET /api/admin/vans/payment-issues
 * @desc    Get all vans with payment issues
 * @access  Admin only
 */
router.get('/vans/payment-issues', adminController.getVansWithPaymentIssues);

module.exports = router;
