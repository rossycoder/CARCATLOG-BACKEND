const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');
const User = require('../models/User');
const TradeDealer = require('../models/TradeDealer');

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


/**
 * Get all users with their car counts (admin only)
 * Returns: User info + total cars count + subscription info
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, userType } = req.query;

    // Build query for users
    const userQuery = {};
    if (search) {
      userQuery.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all users
    const users = await User.find(userQuery)
      .select('email name phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all trade dealers
    const TradeDealer = require('../models/TradeDealer');
    const dealers = await TradeDealer.find(search ? {
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ]
    } : {})
      .select('email businessName phone businessLogo businessWebsite createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get car counts for each user
    const [cars, bikes, vans, tradeSubscriptions] = await Promise.all([
      Car.find({}).select('userId dealerId').lean(),
      Bike.find({}).select('userId').lean(),
      Van.find({}).select('userId').lean(),
      require('../models/TradeSubscription').find({})
        .populate('planId')
        .lean()
    ]);

    // Build user list with car counts
    const userList = [];

    // Add regular users
    for (const user of users) {
      const userId = user._id.toString();
      const userCars = cars.filter(c => c.userId?.toString() === userId).length;
      const userBikes = bikes.filter(b => b.userId?.toString() === userId).length;
      const userVans = vans.filter(v => v.userId?.toString() === userId).length;
      const totalVehicles = userCars + userBikes + userVans;

      // Only include users with vehicles or if no filter
      if (!userType || userType === 'all' || totalVehicles > 0) {
        userList.push({
          _id: user._id,
          type: 'private',
          name: user.name || user.email,
          email: user.email,
          phone: user.phone || 'N/A',
          totalVehicles,
          cars: userCars,
          bikes: userBikes,
          vans: userVans,
          createdAt: user.createdAt,
          subscription: null // Private users don't have subscriptions
        });
      }
    }

    // Add trade dealers with subscription info
    for (const dealer of dealers) {
      const dealerId = dealer._id.toString();
      const dealerCars = cars.filter(c => c.dealerId?.toString() === dealerId).length;
      const totalVehicles = dealerCars;
      
      // Find dealer's subscription - try both string and ObjectId comparison
      let subscription = tradeSubscriptions.find(s => {
        const subDealerId = s.dealerId?._id ? s.dealerId._id.toString() : s.dealerId?.toString();
        return subDealerId === dealerId;
      });
      
      console.log(`[Admin] Dealer: ${dealer.businessName}, ID: ${dealerId}`);
      console.log(`[Admin] Subscription found:`, subscription ? 'YES' : 'NO');
      if (subscription) {
        console.log(`[Admin] Plan: ${subscription.planId?.name}, Status: ${subscription.status}`);
      }

      // Only include dealers with vehicles or if no filter
      if (!userType || userType === 'all' || totalVehicles > 0) {
        userList.push({
          _id: dealer._id,
          type: 'trade',
          name: dealer.businessName || dealer.email,
          email: dealer.email,
          phone: dealer.phone || 'N/A',
          businessLogo: dealer.businessLogo,
          businessWebsite: dealer.businessWebsite,
          totalVehicles,
          cars: dealerCars,
          bikes: 0,
          vans: 0,
          createdAt: dealer.createdAt,
          subscription: subscription ? {
            planName: subscription.planId?.name || 'Unknown',
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            isTrialing: subscription.isTrialing,
            listingsUsed: subscription.listingsUsed,
            listingsLimit: subscription.listingsLimit
          } : null
        });
      }
    }

    // Sort by total vehicles (descending)
    userList.sort((a, b) => b.totalVehicles - a.totalVehicles);

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      totalDealers: dealers.length,
      totalPrivateUsers: userList.filter(u => u.type === 'private').length,
      totalTradeUsers: userList.filter(u => u.type === 'trade').length,
      usersWithVehicles: userList.filter(u => u.totalVehicles > 0).length
    };

    return res.json({
      success: true,
      users: userList,
      stats,
      count: userList.length
    });

  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
};

/**
 * Get all vehicles for a specific user
 * Returns: All cars, bikes, and vans for the user
 */
const getUserVehicles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dealerId } = req.query;

    console.log('[Admin] Fetching vehicles for userId:', userId, 'dealerId:', dealerId);

    let vehicles = [];
    let dealerSubscription = null;

    if (dealerId) {
      // Fetch trade dealer vehicles
      const [cars, bikes, vans, subscription] = await Promise.all([
        Car.find({ dealerId: dealerId }).lean(),
        Bike.find({ dealerId: dealerId }).lean(),
        Van.find({ dealerId: dealerId }).lean(),
        require('../models/TradeSubscription').findOne({ dealerId: dealerId })
          .populate('planId')
          .lean()
      ]);

      console.log('[Admin] Found dealer vehicles - Cars:', cars.length, 'Bikes:', bikes.length, 'Vans:', vans.length);
      console.log('[Admin] Dealer subscription:', subscription);

      dealerSubscription = subscription;

      // Add subscription info to each vehicle
      vehicles = [
        ...cars.map(c => ({ 
          ...c, 
          vehicleType: 'car',
          dealerSubscription: subscription ? {
            planName: subscription.planId?.name || 'Unknown Plan',
            status: subscription.status,
            expiryDate: subscription.currentPeriodEnd,
            isTrialing: subscription.isTrialing
          } : null
        })),
        ...bikes.map(b => ({ 
          ...b, 
          vehicleType: 'bike',
          dealerSubscription: subscription ? {
            planName: subscription.planId?.name || 'Unknown Plan',
            status: subscription.status,
            expiryDate: subscription.currentPeriodEnd,
            isTrialing: subscription.isTrialing
          } : null
        })),
        ...vans.map(v => ({ 
          ...v, 
          vehicleType: 'van',
          dealerSubscription: subscription ? {
            planName: subscription.planId?.name || 'Unknown Plan',
            status: subscription.status,
            expiryDate: subscription.currentPeriodEnd,
            isTrialing: subscription.isTrialing
          } : null
        }))
      ];
    } else {
      // Fetch private user vehicles
      const [cars, bikes, vans] = await Promise.all([
        Car.find({ userId: userId }).lean(),
        Bike.find({ userId: userId }).lean(),
        Van.find({ userId: userId }).lean()
      ]);

      console.log('[Admin] Found user vehicles - Cars:', cars.length, 'Bikes:', bikes.length, 'Vans:', vans.length);

      vehicles = [
        ...cars.map(c => ({ ...c, vehicleType: 'car' })),
        ...bikes.map(b => ({ ...b, vehicleType: 'bike' })),
        ...vans.map(v => ({ ...v, vehicleType: 'van' }))
      ];
    }

    // Sort by creation date (newest first)
    vehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('[Admin] Returning', vehicles.length, 'total vehicles');

    return res.json({
      success: true,
      vehicles,
      count: vehicles.length,
      dealerSubscription
    });

  } catch (error) {
    console.error('[Admin] Error fetching user vehicles:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user vehicles'
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
  getVansWithPaymentIssues,
  getAllUsers,
  getUserVehicles
};