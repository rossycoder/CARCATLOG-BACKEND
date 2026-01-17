const Bike = require('../models/Bike');

// Get all bikes with filtering and pagination
exports.getBikes = async (req, res) => {
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
      bikeType,
      minEngineCC,
      maxEngineCC,
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
    if (bikeType) filter.bikeType = bikeType;

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

    // Engine CC range
    if (minEngineCC || maxEngineCC) {
      filter.engineCC = {};
      if (minEngineCC) filter.engineCC.$gte = Number(minEngineCC);
      if (maxEngineCC) filter.engineCC.$lte = Number(maxEngineCC);
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
    const [bikes, total] = await Promise.all([
      Bike.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Bike.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bikes,
        vehicles: bikes, // Alias for compatibility
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
    console.error('Error fetching bikes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bikes',
      error: error.message
    });
  }
};

// Get single bike by ID
exports.getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id).lean();

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }

    // Increment view count
    await Bike.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
      lastViewedAt: new Date()
    });

    // If this is a trade dealer listing, fetch dealer information
    if (bike.dealerId) {
      const TradeDealer = require('../models/TradeDealer');
      const dealer = await TradeDealer.findById(bike.dealerId).select('businessName logo phone email businessAddress');
      
      if (dealer) {
        // Add dealer logo to bike data
        bike.dealerLogo = dealer.logo;
        
        // Add dealer business address
        if (dealer.businessAddress) {
          bike.dealerBusinessAddress = dealer.businessAddress;
        }
        
        // Enhance seller contact info with dealer details
        if (!bike.sellerContact) {
          bike.sellerContact = {};
        }
        bike.sellerContact.businessName = dealer.businessName;
        bike.sellerContact.type = 'trade';
        bike.sellerContact.phoneNumber = bike.sellerContact.phoneNumber || dealer.phone;
        
        // Add business address to seller contact
        if (dealer.businessAddress) {
          bike.sellerContact.businessAddress = dealer.businessAddress;
        }
      }
    }

    res.json({
      success: true,
      data: bike
    });
  } catch (error) {
    console.error('Error fetching bike:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bike',
      error: error.message
    });
  }
};

// Create new bike
exports.createBike = async (req, res) => {
  try {
    const bike = new Bike(req.body);
    await bike.save();

    res.status(201).json({
      success: true,
      data: bike,
      message: 'Bike created successfully'
    });
  } catch (error) {
    console.error('Error creating bike:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating bike',
      error: error.message
    });
  }
};

// Update bike
exports.updateBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }

    res.json({
      success: true,
      data: bike,
      message: 'Bike updated successfully'
    });
  } catch (error) {
    console.error('Error updating bike:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating bike',
      error: error.message
    });
  }
};

// Delete bike
exports.deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);

    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }

    res.json({
      success: true,
      message: 'Bike deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bike:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bike',
      error: error.message
    });
  }
};

// Search bikes by postcode
exports.searchByPostcode = async (req, res) => {
  try {
    const { postcode, radius = 25, condition, make, model, minPrice, maxPrice, bikeType } = req.query;

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

    // Build filter - find bikes that have coordinates
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
    if (bikeType) filter.bikeType = bikeType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Fetch all bikes with coordinates
    const bikes = await Bike.find(filter).lean();

    // Calculate distance for each bike and filter by radius
    const haversine = require('../utils/haversine');
    const radiusMiles = Number(radius);
    
    const bikesWithDistance = bikes
      .map(bike => {
        let bikeLat, bikeLon;
        
        // Handle both coordinate formats
        if (bike.latitude !== undefined && bike.longitude !== undefined) {
          bikeLat = bike.latitude;
          bikeLon = bike.longitude;
        } else if (bike.location?.coordinates?.length === 2) {
          bikeLon = bike.location.coordinates[0];
          bikeLat = bike.location.coordinates[1];
        } else {
          return null;
        }

        const distance = haversine(
          coords.latitude,
          coords.longitude,
          bikeLat,
          bikeLon
        );
        return { ...bike, distance: Math.round(distance * 10) / 10 };
      })
      .filter(bike => bike !== null && bike.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        bikes: bikesWithDistance,
        vehicles: bikesWithDistance,
        searchLocation: {
          postcode,
          latitude: coords.latitude,
          longitude: coords.longitude
        },
        total: bikesWithDistance.length
      }
    });
  } catch (error) {
    console.error('Error searching bikes by postcode:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching bikes',
      error: error.message
    });
  }
};

// Get bike count
exports.getBikeCount = async (req, res) => {
  try {
    const { condition } = req.query;
    const filter = { status: 'active' };
    if (condition) filter.condition = condition;

    const count = await Bike.countDocuments(filter);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting bike count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bike count',
      error: error.message
    });
  }
};

// Publish bike for trade dealer (bypasses payment)
exports.publishBike = async (req, res) => {
  try {
    console.log('[Bike Publish] ========== START PUBLISH REQUEST ==========');
    console.log('[Bike Publish] Request body:', JSON.stringify(req.body, null, 2));

    const { advertId, vehicleData, advertData, contactDetails, dealerId } = req.body;

    // Verify dealer matches authenticated user
    if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
      console.log('[Bike Publish] Unauthorized: dealer mismatch');
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Dealer ID mismatch' 
      });
    }

    // Find the bike by advertId or create new one
    let bike = await Bike.findOne({ advertId });
    
    if (!bike) {
      // Create new bike
      console.log('[Bike Publish] Creating new bike');
      bike = new Bike({
        advertId: advertId,
        make: vehicleData?.make || 'Unknown',
        model: vehicleData?.model || 'Unknown',
        year: vehicleData?.year || new Date().getFullYear(),
        mileage: vehicleData?.mileage || 0,
        color: vehicleData?.color || 'Not specified',
        fuelType: vehicleData?.fuelType || 'Petrol',
        transmission: 'manual',
        engineCC: vehicleData?.engineCC || 0,
        bikeType: vehicleData?.bikeType || 'Other',
        condition: 'used'
      });
    }

    console.log('[Bike Publish] Found/created bike:', bike._id);

    // Update bike with all details
    bike.price = advertData?.price || bike.price;
    bike.description = advertData?.description || bike.description;
    bike.images = advertData?.photos?.map(p => p.url || p) || bike.images;
    bike.sellerContact = {
      type: 'trade',
      phoneNumber: contactDetails?.phoneNumber,
      email: contactDetails?.email,
      allowEmailContact: contactDetails?.allowEmailContact || false,
      postcode: contactDetails?.postcode,
      businessName: req.dealer?.businessName,
      ...req.dealer?.businessAddress
    };
    bike.dealerId = req.dealerId;
    bike.isDealerListing = true;
    bike.status = 'active';
    bike.publishedAt = new Date();

    // Geocode postcode if available
    if (contactDetails?.postcode) {
      try {
        const postcodeService = require('../services/postcodeService');
        const postcodeData = await postcodeService.lookupPostcode(contactDetails.postcode);
        bike.latitude = postcodeData.latitude;
        bike.longitude = postcodeData.longitude;
        bike.locationName = postcodeData.locationName;
        bike.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
      } catch (error) {
        console.warn('[Bike Publish] Could not geocode postcode:', error.message);
      }
    }

    await bike.save();
    console.log('[Bike Publish] Bike published successfully:', bike._id);

    console.log('[Bike Publish] ========== PUBLISH SUCCESS ==========');
    res.json({
      success: true,
      data: {
        vehicleId: bike._id,
        advertId: bike.advertId,
        status: bike.status
      },
      message: 'Bike published successfully'
    });
  } catch (error) {
    console.error('[Bike Publish] ========== PUBLISH ERROR ==========');
    console.error('[Bike Publish] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish bike',
      error: error.message
    });
  }
};

// Get dealer's bike inventory
exports.getDealerBikes = async (req, res) => {
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

    const [bikes, total] = await Promise.all([
      Bike.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bike.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        bikes,
        vehicles: bikes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting dealer bikes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dealer bikes',
      error: error.message
    });
  }
};

// Get filter options for bikes
exports.getFilterOptions = async (req, res) => {
  try {
    console.log('[Bike Controller] Fetching filter options...');
    
    // Get unique makes (from active bikes only)
    const makes = await Bike.distinct('make', { status: 'active' });
    console.log('[Bike Controller] Found makes:', makes.length);
    
    // Get unique models
    const models = await Bike.distinct('model', { status: 'active' });
    console.log('[Bike Controller] Found models:', models.length);
    
    // Get unique fuel types
    const fuelTypes = await Bike.distinct('fuelType', { status: 'active' });
    console.log('[Bike Controller] Found fuelTypes:', fuelTypes.length);
    
    // Get unique bike types
    const bikeTypes = await Bike.distinct('bikeType', { status: 'active' });
    console.log('[Bike Controller] Found bikeTypes:', bikeTypes.length);
    
    // Get unique colours
    const colours = await Bike.distinct('color', { status: 'active' });
    console.log('[Bike Controller] Found colours:', colours.length);
    
    // Get year range
    const years = await Bike.aggregate([
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
        bikeTypes: bikeTypes.filter(Boolean).sort(),
        colours: colours.filter(Boolean).sort(),
        yearRange: {
          min: yearRange.minYear,
          max: yearRange.maxYear
        }
      }
    };
    
    console.log('[Bike Controller] Returning filter options:', JSON.stringify(result, null, 2));
    
    return res.json(result);

  } catch (error) {
    console.error('[Bike Controller] Error in getFilterOptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

// Search bikes with comprehensive filters
exports.searchBikes = async (req, res) => {
  try {
    console.log('[Bike Controller] Search request received with params:', req.query);
    
    const { 
      make, 
      model, 
      priceFrom,
      priceTo,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
      bikeType,
      colour,
      fuelType,
      sort,
      limit = 50,
      skip = 0 
    } = req.query;

    // Build query - only show active bikes
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
    if (bikeType) query.bikeType = bikeType;
    if (colour) query.color = colour;
    if (fuelType) query.fuelType = fuelType;
    
    console.log('[Bike Controller] Constructed query:', JSON.stringify(query, null, 2));

    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    if (sort) {
      switch (sort) {
        case 'price-low':
          sortOption = { price: 1 };
          break;
        case 'price-high':
          sortOption = { price: -1 };
          break;
        case 'year-new':
          sortOption = { year: -1 };
          break;
        case 'year-old':
          sortOption = { year: 1 };
          break;
        case 'mileage-low':
          sortOption = { mileage: 1 };
          break;
        case 'mileage-high':
          sortOption = { mileage: -1 };
          break;
      }
    }

    // Execute query
    const bikes = await Bike.find(query)
      .limit(Math.min(parseInt(limit), 100)) // Cap at 100
      .skip(parseInt(skip))
      .sort(sortOption);

    const total = await Bike.countDocuments(query);

    console.log('[Bike Controller] Found', total, 'bikes matching filters');

    return res.json({
      success: true,
      bikes: bikes,
      total: total,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('[Bike Controller] Error in searchBikes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search bikes',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
