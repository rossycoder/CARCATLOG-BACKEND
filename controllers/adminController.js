const Car = require('../models/Car');
const User = require('../models/User');

/**
 * Get all listings (admin only)
 */
const getAllListings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.advertStatus = status;
    }
    
    // Search by registration, make, model
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total documents
    const total = await Car.countDocuments(query);

    // Get paginated results
    const cars = await Car.find(query)
      .populate('userId', 'email name')
      .populate('dealerId', 'businessName email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      success: true,
      data: {
        cars,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting all listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listings'
    });
  }
};

/**
 * Get single listing details (admin only)
 */
const getListingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id)
      .populate('userId', 'email name postcode')
      .populate('dealerId', 'businessName email city')
      .populate('historyCheckId')
      .lean();

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: car
    });

  } catch (error) {
    console.error('Error getting listing details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listing details'
    });
  }
};

/**
 * Update any listing (admin only)
 */
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    const car = await Car.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: car,
      message: 'Listing updated successfully'
    });

  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
};

/**
 * Delete any listing (admin only)
 */
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Use the safe delete method from Car model
    const result = await Car.deleteCarWithCleanup(id);

    if (result.success) {
      res.json({
        success: true,
        message: 'Listing deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Listing not found'
      });
    }

  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing'
    });
  }
};

/**
 * Get admin dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalListings,
      activeListings,
      pendingListings,
      soldListings,
      totalUsers,
      recentListings
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ advertStatus: 'active' }),
      Car.countDocuments({ advertStatus: 'pending_payment' }),
      Car.countDocuments({ advertStatus: 'sold' }),
      User.countDocuments(),
      Car.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'email name')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          pendingListings,
          soldListings,
          totalUsers
        },
        recentListings
      }
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

module.exports = {
  getAllListings,
  getListingDetails,
  updateListing,
  deleteListing,
  getDashboardStats
};
