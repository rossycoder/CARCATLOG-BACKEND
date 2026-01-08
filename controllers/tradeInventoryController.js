const Car = require('../models/Car');
const TradeSubscription = require('../models/TradeSubscription');

/**
 * Get all inventory for dealer
 * GET /api/trade/inventory
 */
exports.getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {
      dealerId: req.dealerId,
      isDealerListing: true
    };

    if (status) {
      query.advertStatus = status;
    }

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Car.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Car.countDocuments(query)
    ]);

    res.json({
      success: true,
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory'
    });
  }
};

/**
 * Get inventory stats
 * GET /api/trade/inventory/stats
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      { $match: { dealerId: req.dealerId, isDealerListing: true } },
      {
        $group: {
          _id: '$advertStatus',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    const totalViews = await Car.aggregate([
      { $match: { dealerId: req.dealerId, isDealerListing: true } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    const mostViewed = await Car.find({
      dealerId: req.dealerId,
      isDealerListing: true
    })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('make model year viewCount images');

    const statusCounts = {};
    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: {
        total: stats.reduce((sum, s) => sum + s.count, 0),
        active: statusCounts.active || 0,
        sold: statusCounts.sold || 0,
        draft: statusCounts.draft || 0,
        expired: statusCounts.expired || 0,
        totalViews: totalViews[0]?.total || 0,
        mostViewed
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};

/**
 * Get single vehicle
 * GET /api/trade/inventory/:id
 */
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Car.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle'
    });
  }
};

/**
 * Create new vehicle listing
 * POST /api/trade/inventory
 */
exports.createVehicle = async (req, res) => {
  try {
    console.log('[Trade Inventory] Creating vehicle with data:', JSON.stringify(req.body, null, 2));
    console.log('[Trade Inventory] Dealer info:', {
      id: req.dealerId,
      businessName: req.dealer.businessName,
      businessAddress: req.dealer.businessAddress
    });
    
    // Check listing limit (middleware should have already checked, but double-check)
    if (req.subscription) {
      const canAdd = req.subscription.canAddListing();
      if (!canAdd.allowed) {
        const SubscriptionPlan = require('../models/SubscriptionPlan');
        const plan = await SubscriptionPlan.findById(req.subscription.planId);
        
        return res.status(403).json({
          success: false,
          message: `Your ${plan?.name || 'current'} plan allows ${req.subscription.listingsLimit} listings. You have reached your limit. Please upgrade your plan to add more vehicles.`,
          code: 'LISTING_LIMIT_REACHED',
          subscription: {
            listingsUsed: req.subscription.listingsUsed,
            listingsLimit: req.subscription.listingsLimit,
            planName: plan?.name || 'Unknown'
          }
        });
      }
    }
    
    // Normalize transmission to lowercase
    const transmission = req.body.transmission ? req.body.transmission.toLowerCase() : 'manual';
    
    // Use dealer's business address postcode if not provided
    const postcode = req.body.postcode || req.dealer.businessAddress?.postcode || 'SW1A 1AA';
    
    console.log('[Trade Inventory] Normalized values:', { transmission, postcode });
    
    const vehicleData = {
      ...req.body,
      transmission,  // This will override the spread value
      postcode,      // This will override the spread value
      dealerId: req.dealerId,
      isDealerListing: true,
      advertStatus: 'active',
      publishedAt: new Date(),
      sellerContact: {
        type: 'trade',
        ...req.dealer.businessAddress,
        businessName: req.dealer.businessName,
        email: req.dealer.email,
        phoneNumber: req.dealer.phone
      }
    };

    console.log('[Trade Inventory] Processed vehicle data:', JSON.stringify(vehicleData, null, 2));

    const vehicle = new Car(vehicleData);
    console.log('[Trade Inventory] Saving vehicle to database...');
    await vehicle.save();
    console.log('[Trade Inventory] Vehicle saved successfully:', vehicle._id);

    // Increment subscription usage
    console.log('[Trade Inventory] Incrementing subscription listing count...');
    await req.subscription.incrementListingCount();

    // Update dealer stats
    console.log('[Trade Inventory] Updating dealer stats...');
    await req.dealer.updateStats();

    console.log('[Trade Inventory] Vehicle creation complete!');
    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
    console.error('[Trade Inventory] Create vehicle error:', error);
    console.error('[Trade Inventory] Error stack:', error.stack);
    
    // Send detailed error for debugging
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Update vehicle
 * PUT /api/trade/inventory/:id
 */
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Car.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'dealerId' && key !== 'isDealerListing') {
        vehicle[key] = req.body[key];
      }
    });

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle'
    });
  }
};

/**
 * Delete vehicle
 * DELETE /api/trade/inventory/:id
 */
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Car.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    await vehicle.deleteOne();

    // Decrement subscription usage if was active
    if (vehicle.advertStatus === 'active') {
      await req.subscription.decrementListingCount();
    }

    // Update dealer stats
    await req.dealer.updateStats();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
};

/**
 * Mark vehicle as sold
 * PATCH /api/trade/inventory/:id/sold
 */
exports.markAsSold = async (req, res) => {
  try {
    const vehicle = await Car.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const wasActive = vehicle.advertStatus === 'active';

    vehicle.advertStatus = 'sold';
    vehicle.soldAt = new Date();
    await vehicle.save();

    // Decrement subscription usage if was active
    if (wasActive) {
      await req.subscription.decrementListingCount();
    }

    // Update dealer stats
    await req.dealer.updateStats();

    res.json({
      success: true,
      message: 'Vehicle marked as sold',
      vehicle
    });
  } catch (error) {
    console.error('Mark as sold error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking vehicle as sold'
    });
  }
};

/**
 * Publish vehicle from sell flow (bypasses payment for trade dealers)
 * POST /api/trade/inventory/publish
 * NOTE: This route bypasses subscription checks - it's placed before requireActiveSubscription middleware
 */
exports.publishVehicle = async (req, res) => {
  try {
    console.log('[Trade Publish] ========== START PUBLISH REQUEST ==========');
    console.log('[Trade Publish] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[Trade Publish] Authenticated dealer:', {
      id: req.dealerId,
      businessName: req.dealer?.businessName
    });

    const { advertId, vehicleData, advertData, contactDetails, dealerId } = req.body;

    console.log('[Trade Publish] Publishing vehicle:', { advertId, dealerId });
    console.log('[Trade Publish] Dealer ID comparison:', {
      fromRequest: dealerId,
      fromAuth: req.dealerId.toString(),
      match: dealerId === req.dealerId.toString()
    });

    // Verify dealer matches authenticated user
    // Convert both to strings for comparison
    if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
      console.log('[Trade Publish] Unauthorized: dealer mismatch');
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Dealer ID mismatch' 
      });
    }

    // Check subscription and listing limits
    const subscription = await TradeSubscription.findActiveForDealer(req.dealerId);
    if (subscription) {
      const canAdd = subscription.canAddListing();
      if (!canAdd.allowed) {
        console.log('[Trade Publish] Listing limit reached');
        const SubscriptionPlan = require('../models/SubscriptionPlan');
        const plan = await SubscriptionPlan.findById(subscription.planId);
        
        return res.status(403).json({
          success: false,
          message: canAdd.reason,
          code: 'LISTING_LIMIT_REACHED',
          subscription: {
            listingsUsed: subscription.listingsUsed,
            listingsLimit: subscription.listingsLimit,
            planName: plan?.name || 'Unknown'
          }
        });
      }
    }

    // Find the car by advertId
    const car = await Car.findOne({ advertId });
    if (!car) {
      console.log('[Trade Publish] Vehicle not found:', advertId);
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }

    console.log('[Trade Publish] Found vehicle:', car._id);

    // Update car with all details
    car.price = advertData?.price || car.price;
    car.description = advertData?.description || car.description;
    car.images = advertData?.photos?.map(p => p.url) || car.images;
    car.sellerContact = {
      phoneNumber: contactDetails.phoneNumber,
      email: contactDetails.email,
      allowEmailContact: contactDetails.allowEmailContact,
      postcode: contactDetails.postcode,
      type: 'trade',
      businessName: req.dealer.businessName,
      ...req.dealer.businessAddress
    };
    car.dealerId = req.dealerId;
    car.isDealerListing = true;
    car.sellerType = 'dealer';
    car.advertStatus = 'active';
    car.publishedAt = new Date();

    await car.save();
    console.log('[Trade Publish] Vehicle published successfully:', car._id);

    // Update subscription listing count
    if (subscription) {
      try {
        await subscription.incrementListingCount();
        console.log('[Trade Publish] Updated subscription listing count:', subscription.listingsUsed);
      } catch (subError) {
        console.log('[Trade Publish] Could not update subscription:', subError.message);
      }
    }

    // Update dealer stats (optional)
    try {
      if (req.dealer.updateStats) {
        await req.dealer.updateStats();
      }
    } catch (statsError) {
      console.log('[Trade Publish] Could not update dealer stats (optional):', statsError.message);
    }

    console.log('[Trade Publish] ========== PUBLISH SUCCESS ==========');
    res.json({
      success: true,
      data: {
        vehicleId: car._id,
        advertId: car.advertId,
        status: car.advertStatus
      },
      message: 'Vehicle published successfully'
    });
  } catch (error) {
    console.error('[Trade Publish] ========== PUBLISH ERROR ==========');
    console.error('[Trade Publish] Error:', error);
    console.error('[Trade Publish] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish vehicle',
      error: error.message
    });
  }
};
