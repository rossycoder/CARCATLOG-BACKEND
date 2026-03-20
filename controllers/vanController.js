const Van = require('../models/Van');
const lightweightVanService = require('../services/lightweightVanService');

// Get all vans with filtering and pagination
exports.getVans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      condition,
      make,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      fuelType,
      vanType,
      minPayload,
      maxPayload,
      wheelbase,
      roofHeight,
      minMileage,
      maxMileage,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (condition) filter.condition = condition;
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (vanType) filter.vanType = vanType;
    if (wheelbase) filter.wheelbase = wheelbase;
    if (roofHeight) filter.roofHeight = roofHeight;

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Year range
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }

    // Payload capacity range
    if (minPayload || maxPayload) {
      filter.payloadCapacity = {};
      if (minPayload) filter.payloadCapacity.$gte = Number(minPayload);
      if (maxPayload) filter.payloadCapacity.$lte = Number(maxPayload);
    }

    // Mileage range
    if (minMileage || maxMileage) {
      filter.mileage = {};
      if (minMileage) filter.mileage.$gte = Number(minMileage);
      if (maxMileage) filter.mileage.$lte = Number(maxMileage);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [vans, total] = await Promise.all([
      Van.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Van.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        vans,
        vehicles: vans,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        total
      }
    });
  } catch (error) {
    console.error('Error fetching vans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vans',
      error: error.message
    });
  }
};

// Get single van by ID
exports.getVanById = async (req, res) => {
  try {
    const van = await Van.findById(req.params.id).lean();

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Van not found'
      });
    }

    // Increment view count
    await Van.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
      lastViewedAt: new Date()
    });

    // If this is a trade dealer listing, fetch dealer information
    if (van.dealerId) {
      const TradeDealer = require('../models/TradeDealer');
      const dealer = await TradeDealer.findById(van.dealerId).select('businessName logo phone email businessAddress');
      
      if (dealer) {
        // Add dealer logo to van data
        van.dealerLogo = dealer.logo;
        
        // Add dealer business address
        if (dealer.businessAddress) {
          van.dealerBusinessAddress = dealer.businessAddress;
        }
        
        // Enhance seller contact info with dealer details
        if (!van.sellerContact) {
          van.sellerContact = {};
        }
        van.sellerContact.businessName = dealer.businessName;
        van.sellerContact.type = 'trade';
        van.sellerContact.phoneNumber = van.sellerContact.phoneNumber || dealer.phone;
        
        // Add business address to seller contact
        if (dealer.businessAddress) {
          van.sellerContact.businessAddress = dealer.businessAddress;
        }
      }
    }

    res.json({
      success: true,
      data: van
    });
  } catch (error) {
    console.error('Error fetching van:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching van',
      error: error.message
    });
  }
};

// Create new van
exports.createVan = async (req, res) => {
  try {
    // CRITICAL FIX: Set userId from authenticated user
    const vanData = { ...req.body };
    if (req.user && req.user._id) {
      vanData.userId = req.user._id;
      console.log(`✅ Setting userId: ${req.user._id} (${req.user.email})`);
    }
    
    const van = new Van(vanData);
    await van.save();

    res.status(201).json({
      success: true,
      data: van,
      message: 'Van created successfully'
    });
  } catch (error) {
    console.error('Error creating van:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating van',
      error: error.message
    });
  }
};

// Update van
exports.updateVan = async (req, res) => {
  try {
    const van = await Van.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Van not found'
      });
    }

    res.json({
      success: true,
      data: van,
      message: 'Van updated successfully'
    });
  } catch (error) {
    console.error('Error updating van:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating van',
      error: error.message
    });
  }
};

// Delete van
exports.deleteVan = async (req, res) => {
  try {
    const van = await Van.findByIdAndDelete(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Van not found'
      });
    }

    res.json({
      success: true,
      message: 'Van deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting van:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting van',
      error: error.message
    });
  }
};

/**
 * Mark van as sold
 * PATCH /api/vans/:id/sold
 */
exports.markVanAsSold = async (req, res) => {
  try {
    const van = await Van.findById(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Van not found'
      });
    }

    // Check if van belongs to the dealer (if authenticated as dealer)
    if (req.dealerId && van.dealerId && van.dealerId.toString() !== req.dealerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this van as sold'
      });
    }

    const wasActive = van.advertStatus === 'active';

    // Fix any invalid historyCheckStatus values before saving
    if (van.historyCheckStatus && !['pending', 'verified', 'failed', 'not_required'].includes(van.historyCheckStatus)) {
      console.log(`⚠️  Invalid van historyCheckStatus: ${van.historyCheckStatus}, setting to 'not_required'`);
      van.historyCheckStatus = 'not_required';
    }

    van.advertStatus = 'sold';
    van.soldAt = new Date();
    
    // Save with validation disabled to avoid enum errors on old data
    await van.save({ validateBeforeSave: false });

    // Decrement subscription usage if was active and dealer is authenticated
    if (wasActive && req.subscription) {
      await req.subscription.decrementListingCount();
    }

    // Update dealer stats if dealer is authenticated
    if (req.dealer) {
      await req.dealer.updateStats();
    }

    res.json({
      success: true,
      message: 'Van marked as sold',
      van
    });
  } catch (error) {
    console.error('Error marking van as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking van as sold',
      error: error.message
    });
  }
};

// Get van count
exports.getVanCount = async (req, res) => {
  try {
    const { condition } = req.query;
    const filter = { status: 'active' };
    if (condition) filter.condition = condition;

    const count = await Van.countDocuments(filter);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting van count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting van count',
      error: error.message
    });
  }
};

// Search vans by postcode
exports.searchByPostcode = async (req, res) => {
  try {
    const { postcode, radius = 25, condition, make, model, minPrice, maxPrice, vanType } = req.query;

    if (!postcode) {
      return res.status(400).json({
        success: false,
        message: 'Postcode is required'
      });
    }

    // Get coordinates from postcode service
    const postcodeService = require('../services/postcodeService');
    let coords;
    try {
      const postcodeData = await postcodeService.lookupPostcode(postcode);
      coords = {
        latitude: postcodeData.latitude,
        longitude: postcodeData.longitude
      };
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid postcode'
      });
    }

    // Build filter - find vans that have coordinates
    const filter = {
      status: 'active',
      $or: [
        {
          latitude: { $exists: true, $ne: null },
          longitude: { $exists: true, $ne: null }
        },
        {
          'location.coordinates': { $exists: true, $ne: null }
        }
      ]
    };
    
    if (condition) filter.condition = condition;
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (vanType) filter.vanType = vanType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Fetch all vans with coordinates
    const vans = await Van.find(filter).lean();

    // Calculate distance for each van and filter by radius
    const haversine = require('../utils/haversine');
    const radiusMiles = Number(radius);
    
    // NATIONWIDE SEARCH: Always show ALL vans nationwide with distance
    // Set effective radius to 10000 miles to cover entire UK
    const effectiveRadius = 10000; // Nationwide search
    
    const vansWithDistance = vans
      .map(van => {
        let vanLat, vanLon;
        
        // Handle both coordinate formats
        if (van.latitude !== undefined && van.longitude !== undefined) {
          vanLat = van.latitude;
          vanLon = van.longitude;
        } else if (van.location?.coordinates?.length === 2) {
          vanLon = van.location.coordinates[0];
          vanLat = van.location.coordinates[1];
        } else {
          return null;
        }

        const distance = haversine(
          coords.latitude,
          coords.longitude,
          vanLat,
          vanLon
        );
        return { ...van, distance: Math.round(distance * 10) / 10 };
      })
      .filter(van => {
        if (van === null) return false;
        // Show all vans nationwide (within 10000 miles = entire UK and beyond)
        return van.distance <= effectiveRadius;
      })
      .sort((a, b) => a.distance - b.distance);
    
    console.log(`🔍 Van search NATIONWIDE - Found ${vansWithDistance.length} vans`);

    res.json({
      success: true,
      data: {
        vans: vansWithDistance,
        vehicles: vansWithDistance,
        searchLocation: {
          postcode,
          latitude: coords.latitude,
          longitude: coords.longitude
        },
        total: vansWithDistance.length
      }
    });
  } catch (error) {
    console.error('Error searching vans by postcode:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vans',
      error: error.message
    });
  }
};

// Publish van for trade dealer (bypasses payment)
exports.publishVan = async (req, res) => {
  try {
    console.log('[Van Publish] ========== START PUBLISH REQUEST ==========');
    console.log('[Van Publish] Request body:', JSON.stringify(req.body, null, 2));

    const { advertId, vehicleData, advertData, contactDetails, dealerId } = req.body;

    // Verify dealer matches authenticated user
    if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
      console.log('[Van Publish] Unauthorized: dealer mismatch');
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Dealer ID mismatch' 
      });
    }

    // Find the van by advertId or create new one
    let van = await Van.findOne({ advertId });
    
    if (!van) {
      // Create new van
      console.log('[Van Publish] Creating new van');
      van = new Van({
        advertId: advertId,
        make: vehicleData?.make || 'Unknown',
        model: vehicleData?.model || 'Unknown',
        year: vehicleData?.year || new Date().getFullYear(),
        mileage: vehicleData?.mileage || 0,
        color: vehicleData?.color || 'Not specified',
        fuelType: vehicleData?.fuelType || 'Diesel',
        transmission: 'manual',
        vanType: vehicleData?.vanType || 'Panel Van',
        payloadCapacity: vehicleData?.payloadCapacity || 0,
        loadLength: vehicleData?.loadLength || 0,
        loadWidth: vehicleData?.loadWidth || 0,
        loadHeight: vehicleData?.loadHeight || 0,
        condition: 'used'
      });
    }

    console.log('[Van Publish] Found/created van:', van._id);

    // Update van with all details
    van.price = advertData?.price || van.price;
    van.description = advertData?.description || van.description;
    van.images = advertData?.photos?.map(p => p.url || p) || van.images;
    van.sellerContact = {
      type: 'trade',
      phoneNumber: contactDetails?.phoneNumber,
      email: contactDetails?.email,
      allowEmailContact: contactDetails?.allowEmailContact || false,
      postcode: contactDetails?.postcode,
      businessName: advertData?.businessName || req.dealer?.businessName,
      businessLogo: advertData?.businessLogo || req.dealer?.logo,
      businessWebsite: advertData?.businessWebsite || req.dealer?.website,
      tradingName: req.dealer?.tradingName,
      ...req.dealer?.businessAddress
    };
    van.dealerId = req.dealerId;
    van.isDealerListing = true;
    van.status = 'active';
    van.publishedAt = new Date();

    // Geocode postcode if available
    if (contactDetails?.postcode) {
      try {
        const postcodeService = require('../services/postcodeService');
        const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
        van.latitude = postcodeData.latitude;
        van.longitude = postcodeData.longitude;
        van.locationName = postcodeData.locationName;
        van.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
      } catch (error) {
        console.warn('[Van Publish] Could not geocode postcode:', error.message);
      }
    }

    await van.save();
    console.log('[Van Publish] Van published successfully:', van._id);

    console.log('[Van Publish] ========== PUBLISH SUCCESS ==========');
    res.json({
      success: true,
      data: {
        vehicleId: van._id,
        advertId: van.advertId,
        status: van.status
      },
      message: 'Van published successfully'
    });
  } catch (error) {
    console.error('[Van Publish] ========== PUBLISH ERROR ==========');
    console.error('[Van Publish] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish van',
      error: error.message
    });
  }
};

// Get dealer's van inventory
exports.getDealerVans = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {
      dealerId: req.dealerId,
      isDealerListing: true
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [vans, total] = await Promise.all([
      Van.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Van.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        vans,
        vehicles: vans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting dealer vans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dealer vans',
      error: error.message
    });
  }
};

// Get filter options for vans
exports.getFilterOptions = async (req, res) => {
  try {
    console.log('[Van Controller] Fetching filter options...');
    
    // Get unique makes (from active vans only)
    const makes = await Van.distinct('make', { status: 'active' });
    console.log('[Van Controller] Found makes:', makes.length);
    
    // Get unique models
    const models = await Van.distinct('model', { status: 'active' });
    console.log('[Van Controller] Found models:', models.length);
    
    // Get unique fuel types
    const fuelTypes = await Van.distinct('fuelType', { status: 'active' });
    console.log('[Van Controller] Found fuelTypes:', fuelTypes.length);
    
    // Get unique van types
    const vanTypes = await Van.distinct('vanType', { status: 'active' });
    console.log('[Van Controller] Found vanTypes:', vanTypes.length);
    
    // Get unique colours
    const colours = await Van.distinct('color', { status: 'active' });
    console.log('[Van Controller] Found colours:', colours.length);
    
    // Get year range
    const years = await Van.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, minYear: { $min: '$year' }, maxYear: { $max: '$year' } } }
    ]);
    
    const yearRange = years.length > 0 ? years[0] : { minYear: 2000, maxYear: new Date().getFullYear() };

    const result = {
      success: true,
      data: {
        makes: makes.filter(Boolean).sort(),
        models: models.filter(Boolean).sort(),
        fuelTypes: fuelTypes.filter(Boolean).sort(),
        vanTypes: vanTypes.filter(Boolean).sort(),
        colours: colours.filter(Boolean).sort(),
        yearRange: {
          min: yearRange.minYear,
          max: yearRange.maxYear
        }
      }
    };
    
    console.log('[Van Controller] Returning filter options:', JSON.stringify(result, null, 2));
    
    return res.json(result);

  } catch (error) {
    console.error('[Van Controller] Error in getFilterOptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

// Search vans with comprehensive filters
exports.searchVans = async (req, res) => {
  try {
    console.log('[Van Controller] Search request received with params:', req.query);
    
    const { 
      make, 
      model, 
      priceFrom,
      priceTo,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
      vanType,
      colour,
      fuelType,
      sort,
      postcode,
      radius = 10000, // Default: Nationwide search (entire UK)
      limit = 50,
      skip = 0 
    } = req.query;

    // Build query - only show active vans
    const query = { status: 'active' };

    // Make and Model filters (case-insensitive exact match)
    if (make) query.make = new RegExp(`^${make}$`, 'i');
    if (model) query.model = new RegExp(`^${model}$`, 'i');
    
    // Price range filters
    if (priceFrom || priceTo) {
      query.price = {};
      if (priceFrom) query.price.$gte = parseFloat(priceFrom);
      if (priceTo) query.price.$lte = parseFloat(priceTo);
    }
    
    // Year range filters
    if (yearFrom || yearTo) {
      query.year = {};
      if (yearFrom) query.year.$gte = parseInt(yearFrom);
      if (yearTo) query.year.$lte = parseInt(yearTo);
    }
    
    // Mileage range filters
    if (mileageFrom || mileageTo) {
      query.mileage = {};
      if (mileageFrom) query.mileage.$gte = parseInt(mileageFrom);
      if (mileageTo) query.mileage.$lte = parseInt(mileageTo);
    }
    
    // Exact match filters
    if (vanType) query.vanType = vanType;
    if (colour) query.color = colour;
    if (fuelType) query.fuelType = fuelType;
    
    console.log('[Van Controller] Constructed query:', JSON.stringify(query, null, 2));

    // Execute query
    let vans = await Van.find(query)
      .limit(Math.min(parseInt(limit), 100)) // Cap at 100
      .skip(parseInt(skip))
      .lean();

    const total = await Van.countDocuments(query);

    // Calculate distance if postcode provided
    if (postcode) {
      const postcodeService = require('../services/postcodeService');
      const haversine = require('../utils/haversine');
      
      try {
        const postcodeData = await postcodeService.lookupPostcode(postcode);
        const userCoords = {
          latitude: postcodeData.latitude,
          longitude: postcodeData.longitude
        };
        
        console.log('[Van Controller] Calculating distances from:', postcode);
        
        // Calculate distance for each van
        vans = vans.map(van => {
          let vanLat, vanLon;
          
          // Handle both coordinate formats
          if (van.latitude !== undefined && van.longitude !== undefined) {
            vanLat = van.latitude;
            vanLon = van.longitude;
          } else if (van.location?.coordinates?.length === 2) {
            vanLon = van.location.coordinates[0];
            vanLat = van.location.coordinates[1];
          } else {
            return { ...van, distance: 0 };
          }

          const distance = haversine(
            userCoords.latitude,
            userCoords.longitude,
            vanLat,
            vanLon
          );
          
          return { ...van, distance: Math.round(distance * 10) / 10 };
        });
        
        // Filter by radius if specified
        if (radius && radius !== 'nationwide') {
          const radiusMiles = Number(radius);
          vans = vans.filter(van => van.distance <= radiusMiles);
          console.log('[Van Controller] Filtered to', vans.length, 'vans within', radius, 'miles');
        } else {
          console.log('[Van Controller] Showing all', vans.length, 'vans nationwide (sorted by distance)');
        }
      } catch (err) {
        console.warn('[Van Controller] Could not calculate distances:', err.message);
        // Continue without distance calculation
        vans = vans.map(van => ({ ...van, distance: 0 }));
      }
    } else {
      // No postcode - set distance to 0
      vans = vans.map(van => ({ ...van, distance: 0 }));
    }

    // Determine sort order
    let sortOption = 'distance'; // Default: nearest first if postcode provided
    
    if (sort) {
      sortOption = sort;
    } else if (!postcode) {
      sortOption = 'newest'; // Default to newest if no postcode
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'price-low':
        vans.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        vans.sort((a, b) => b.price - a.price);
        break;
      case 'year-new':
        vans.sort((a, b) => b.year - a.year);
        break;
      case 'year-old':
        vans.sort((a, b) => a.year - b.year);
        break;
      case 'mileage-low':
        vans.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'mileage-high':
        vans.sort((a, b) => b.mileage - a.mileage);
        break;
      case 'distance':
        vans.sort((a, b) => a.distance - b.distance);
        break;
      case 'newest':
      default:
        vans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    console.log('[Van Controller] Found', vans.length, 'vans matching filters');

    return res.json({
      success: true,
      vans: vans,
      total: vans.length, // Update total to reflect filtered count
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: vans.length > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('[Van Controller] Error in searchVans:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search vans',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Basic van lookup using optimized DVLA-first approach (FREE API first)
exports.basicVanLookup = async (req, res) => {
  try {
    console.log('[Van Controller] ========== BASIC VAN LOOKUP ==========');
    
    const { registration } = req.params;
    const { mileage } = req.query;
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        error: 'Registration number is required'
      });
    }
    
    console.log(`[Van Controller] Looking up van: ${registration} with ${mileage || 'unknown'} miles`);
    
    // Clean registration number
    const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
    const parsedMileage = mileage ? parseInt(mileage, 10) : 50000;
    
    // Get basic van data using optimized service (FREE DVLA API first)
    const result = await lightweightVanService.getBasicVanData(cleanedReg, parsedMileage);
    
    if (!result.success) {
      console.log(`[Van Controller] Lookup failed: ${result.error}`);
      return res.status(404).json({
        success: false,
        error: result.error,
        data: null
      });
    }
    
    console.log(`[Van Controller] Lookup successful - Cost: £${result.cost}, API: ${result.data.apiProvider}`);
    
    return res.json({
      success: true,
      data: result.data,
      metadata: {
        fromCache: result.fromCache,
        apiCalls: result.apiCalls,
        cost: result.cost,
        apiProvider: result.data.apiProvider
      }
    });
    
  } catch (error) {
    console.error('[Van Controller] Basic lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during van lookup',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
