const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');
const User = require('../models/User');

/**
 * Get all listings (admin only) - Cars, Bikes, and Vans
 */
const getAllListings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 1000, // Get all for admin dashboard
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status && status !== 'All') {
      const statusMap = {
        'Active': 'active',
        'Expired': 'expired',
        'Sold': 'sold',
        'Draft': 'draft',
        'Pending': 'pending_payment'
      };
      query.advertStatus = statusMap[status] || status;
    }
    
    // Search by registration, make, model, VIN, owner name, owner email
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all vehicle types
    const [cars, bikes, vans] = await Promise.all([
      Car.find(query)
        .populate('userId', 'email name')
        .populate('dealerId', 'businessName email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .lean(),
      Bike.find(query)
        .populate('userId', 'email name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .lean(),
      Van.find(query)
        .populate('userId', 'email name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .lean()
    ]);

    // Combine and format all listings
    const allListings = [
      ...cars.map(car => ({
        ...car,
        vehicleType: 'car',
        ownerEmail: car.userId?.email || car.dealerId?.email || 'N/A',
        ownerName: car.userId?.name || car.dealerId?.businessName || 'N/A'
      })),
      ...bikes.map(bike => ({
        ...bike,
        vehicleType: 'bike',
        ownerEmail: bike.userId?.email || 'N/A',
        ownerName: bike.userId?.name || 'N/A'
      })),
      ...vans.map(van => ({
        ...van,
        vehicleType: 'van',
        ownerEmail: van.userId?.email || 'N/A',
        ownerName: van.userId?.name || 'N/A'
      }))
    ];

    // Sort combined listings
    allListings.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' 
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

    res.json({
      success: true,
      listings: allListings,
      total: allListings.length
    });

  } catch (error) {
    console.error('Error getting all listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listings',
      error: error.message
    });
  }
};

/**
 * Get single listing details (admin only)
 */
const getListingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in all vehicle types
    let vehicle = await Car.findById(id)
      .populate('userId', 'email name postcode')
      .populate('dealerId', 'businessName email city')
      .populate('historyCheckId')
      .lean();
    
    let vehicleType = 'car';

    if (!vehicle) {
      vehicle = await Bike.findById(id)
        .populate('userId', 'email name postcode')
        .lean();
      vehicleType = 'bike';
    }

    if (!vehicle) {
      vehicle = await Van.findById(id)
        .populate('userId', 'email name postcode')
        .lean();
      vehicleType = 'van';
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...vehicle,
        vehicleType,
        ownerEmail: vehicle.userId?.email || 'N/A',
        ownerName: vehicle.userId?.name || 'N/A'
      }
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
    delete updates.vehicleType;

    // Try to find and update in all vehicle types
    let vehicle = await Car.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      vehicle = await Bike.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    if (!vehicle) {
      vehicle = await Van.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
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

    // Try to delete from all vehicle types
    let result = await Car.deleteCarWithCleanup(id);

    if (!result.success) {
      // Try Bike
      const bike = await Bike.findByIdAndDelete(id);
      if (bike) {
        result = { success: true };
      }
    }

    if (!result.success) {
      // Try Van
      const van = await Van.findByIdAndDelete(id);
      if (van) {
        result = { success: true };
      }
    }

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
      totalCars,
      totalBikes,
      totalVans,
      activeCars,
      activeBikes,
      activeVans,
      pendingCars,
      pendingBikes,
      pendingVans,
      soldCars,
      soldBikes,
      soldVans,
      totalUsers,
      recentCars,
      recentBikes,
      recentVans
    ] = await Promise.all([
      Car.countDocuments(),
      Bike.countDocuments(),
      Van.countDocuments(),
      Car.countDocuments({ advertStatus: 'active' }),
      Bike.countDocuments({ advertStatus: 'active' }),
      Van.countDocuments({ advertStatus: 'active' }),
      Car.countDocuments({ advertStatus: 'pending_payment' }),
      Bike.countDocuments({ advertStatus: 'pending_payment' }),
      Van.countDocuments({ advertStatus: 'pending_payment' }),
      Car.countDocuments({ advertStatus: 'sold' }),
      Bike.countDocuments({ advertStatus: 'sold' }),
      Van.countDocuments({ advertStatus: 'sold' }),
      User.countDocuments(),
      Car.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'email name').lean(),
      Bike.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'email name').lean(),
      Van.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'email name').lean()
    ]);

    const totalListings = totalCars + totalBikes + totalVans;
    const activeListings = activeCars + activeBikes + activeVans;
    const pendingListings = pendingCars + pendingBikes + pendingVans;
    const soldListings = soldCars + soldBikes + soldVans;

    // Combine recent listings
    const recentListings = [
      ...recentCars.map(c => ({ ...c, vehicleType: 'car' })),
      ...recentBikes.map(b => ({ ...b, vehicleType: 'bike' })),
      ...recentVans.map(v => ({ ...v, vehicleType: 'van' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          pendingListings,
          soldListings,
          totalUsers,
          breakdown: {
            cars: { total: totalCars, active: activeCars },
            bikes: { total: totalBikes, active: activeBikes },
            vans: { total: totalVans, active: activeVans }
          }
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

/**
 * Get API usage statistics (admin only)
 */
const getAPIStats = async (req, res) => {
  try {
    const safeAPI = require('../services/safeAPIService');
    const vehicleAPILimit = require('../services/vehicleAPILimitService');
    
    // Get overall usage stats
    const usageStats = await safeAPI.getUsageStats();
    
    // Get all vehicle API stats
    const vehicleStats = await vehicleAPILimit.getAllVehicleAPIStats(50);
    
    // Get excessive API calls
    const excessiveCalls = await vehicleAPILimit.findExcessiveAPICalls(4);
    
    res.json({
      success: true,
      data: {
        usage: usageStats,
        topVehicles: vehicleStats,
        excessiveCalls: excessiveCalls.length,
        excessiveCallsDetails: excessiveCalls.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error getting API stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API statistics',
      error: error.message
    });
  }
};

/**
 * Get API call summary for specific vehicle (admin only)
 */
const getVehicleAPIStats = async (req, res) => {
  try {
    const { vrm } = req.params;
    const safeAPI = require('../services/safeAPIService');
    
    // Get vehicle summary
    const summary = await safeAPI.getVehicleSummary(vrm);
    
    // Generate detailed report
    const report = await safeAPI.generateVehicleReport(vrm);
    
    res.json({
      success: true,
      data: {
        summary,
        report
      }
    });
  } catch (error) {
    console.error('Error getting vehicle API stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle API statistics',
      error: error.message
    });
  }
};

/**
 * Find vehicles with excessive API calls (admin only)
 */
const getExcessiveAPICalls = async (req, res) => {
  try {
    const { threshold = 4 } = req.query;
    const vehicleAPILimit = require('../services/vehicleAPILimitService');
    
    const excessiveCalls = await vehicleAPILimit.findExcessiveAPICalls(parseInt(threshold));
    
    res.json({
      success: true,
      data: {
        threshold: parseInt(threshold),
        count: excessiveCalls.length,
        vehicles: excessiveCalls
      }
    });
  } catch (error) {
    console.error('Error getting excessive API calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get excessive API calls',
      error: error.message
    });
  }
};


/**
 * Manually activate a van (admin only)
 * POST /api/admin/vans/:id/activate
 */
const activateVan = async (req, res) => {
  try {
    const { id } = req.params;
    const Van = require('../models/Van');
    
    console.log(`🔧 [Admin] Manually activating van: ${id}`);
    
    // Find van
    const van = await Van.findById(id);
    
    if (!van) {
      return res.status(404).json({
        success: false,
        error: 'Van not found'
      });
    }
    
    // Check if already active
    if (van.status === 'active') {
      return res.json({
        success: true,
        message: 'Van is already active',
        data: van
      });
    }
    
    // Activate van
    van.status = 'active';
    van.publishedAt = new Date();
    
    // If no advertising package, create a default one
    if (!van.advertisingPackage || !van.advertisingPackage.packageId) {
      van.advertisingPackage = {
        packageId: 'bronze',
        packageName: 'Bronze Package',
        duration: '4 weeks',
        price: 0,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 4 weeks
      };
    }
    
    await van.save();
    
    console.log(`✅ [Admin] Van activated: ${van._id}`);
    console.log(`   Make/Model: ${van.make} ${van.model}`);
    console.log(`   Registration: ${van.registrationNumber}`);
    console.log(`   Status: ${van.status}`);
    
    res.json({
      success: true,
      message: 'Van activated successfully',
      data: van
    });
    
  } catch (error) {
    console.error('❌ [Admin] Error activating van:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate van',
      details: error.message
    });
  }
};

/**
 * Get all vans with payment issues (admin only)
 * GET /api/admin/vans/payment-issues
 */
const getVansWithPaymentIssues = async (req, res) => {
  try {
    const Van = require('../models/Van');
    
    // Find vans that have advertising package but are not active
    const vans = await Van.find({
      'advertisingPackage.stripePaymentIntentId': { $exists: true },
      status: { $ne: 'active' }
    })
    .populate('userId', 'email name')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`🔍 [Admin] Found ${vans.length} vans with payment issues`);
    
    res.json({
      success: true,
      data: {
        vans,
        count: vans.length
      }
    });
    
  } catch (error) {
    console.error('❌ [Admin] Error fetching vans with payment issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vans',
      details: error.message
    });
  }
};

module.exports = {
  getAllListings,
  getListingDetails,
  updateListing,
  deleteListing,
  getDashboardStats,
  getAPIStats,
  getVehicleAPIStats,
  getExcessiveAPICalls,
  activateVan,
  getVansWithPaymentIssues
};
