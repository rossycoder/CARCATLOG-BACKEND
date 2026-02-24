const Bike = require('../models/Bike');
const lightweightBikeService = require('../services/lightweightBikeService');
const motHistoryService = require('../services/motHistoryService');
const historyService = require('../services/historyService');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

// Initialize services
const universalService = new UniversalAutoCompleteService();

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

// Create new bike with auto-enhancement
exports.createBike = async (req, res) => {
  try {
    console.log('🏍️ Creating new bike with data:', req.body);

    // Auto-enhance bike data if registration is provided
    let bikeData = { ...req.body };
    
    if (bikeData.registrationNumber && !bikeData.skipAutoEnhancement) {
      try {
        console.log(`🔍 Auto-enhancing bike data for registration: ${bikeData.registrationNumber}`);
        
        // Get enhanced data
        const enhancedResult = await lightweightBikeService.getBasicBikeData(
          bikeData.registrationNumber, 
          bikeData.mileage || 0
        );
        
        if (enhancedResult.success) {
          // Merge enhanced data with user data (user data takes priority)
          const enhanced = enhancedResult.data;
          
          bikeData = {
            ...enhanced,
            ...bikeData, // User data overrides enhanced data
            fieldSources: {
              make: bikeData.make ? 'user' : (enhanced.fieldSources?.make || 'dvla'),
              model: bikeData.model ? 'user' : (enhanced.fieldSources?.model || 'dvla'),
              variant: bikeData.variant ? 'user' : (enhanced.fieldSources?.variant || 'dvla'),
              color: bikeData.color ? 'user' : (enhanced.fieldSources?.color || 'dvla'),
              year: bikeData.year ? 'user' : (enhanced.fieldSources?.year || 'dvla'),
              engineSize: bikeData.engineSize ? 'user' : (enhanced.fieldSources?.engineSize || 'dvla'),
              fuelType: bikeData.fuelType ? 'user' : (enhanced.fieldSources?.fuelType || 'dvla'),
              transmission: bikeData.transmission ? 'user' : (enhanced.fieldSources?.transmission || 'dvla')
            },
            dataSources: enhanced.dataSources || {}
          };
          
          console.log(`✅ Bike data auto-enhanced for ${bikeData.registrationNumber}`);
        }
      } catch (enhanceError) {
        console.log(`⚠️ Auto-enhancement failed for ${bikeData.registrationNumber}: ${enhanceError.message}`);
        // Continue with user-provided data
      }
    }

    const bike = new Bike(bikeData);
    await bike.save();

    // Auto-fetch MOT history and vehicle history in background
    if (bike.registrationNumber) {
      setImmediate(async () => {
        try {
          // Fetch MOT history
          const motResult = await motHistoryService.getMOTHistory(bike.registrationNumber);
          if (motResult.success && motResult.data) {
            bike.motHistory = motResult.data;
            bike.dataSources.motHistory = true;
            await bike.save();
            console.log(`✅ MOT history auto-fetched for bike ${bike._id}`);
          }
        } catch (motError) {
          console.log(`⚠️ Background MOT fetch failed for bike ${bike._id}: ${motError.message}`);
        }

        try {
          // Fetch vehicle history
          const historyResult = await historyService.getVehicleHistory(bike.registrationNumber);
          if (historyResult.success && historyResult.data) {
            bike.historyCheckData = historyResult.data;
            bike.historyCheckStatus = 'completed';
            bike.historyCheckDate = new Date();
            bike.dataSources.historyCheck = true;
            await bike.save();
            console.log(`✅ Vehicle history auto-fetched for bike ${bike._id}`);
          }
        } catch (historyError) {
          console.log(`⚠️ Background history fetch failed for bike ${bike._id}: ${historyError.message}`);
        }
      });
    }

    res.status(201).json({
      success: true,
      data: bike,
      message: 'Bike created successfully'
    });
  } catch (error) {
    console.error('Error creating bike:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bike with this registration already exists'
      });
    }
    
    res.status(500).json({
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

// Patch bike details (make, model, variant only)
exports.patchBikeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, variant, fuelType, bikeType, color, engineSize, engineCC, userEditedFields } = req.body;
    
    console.log('🔧 Patching bike details:', { id, make, model, variant, fuelType, bikeType, color, engineSize, engineCC });
    
    const bike = await Bike.findById(id);
    
    if (!bike) {
      return res.status(404).json({ 
        success: false,
        message: 'Bike not found' 
      });
    }
    
    // Update fields if provided
    if (make) bike.make = make;
    if (model) bike.model = model;
    if (variant !== undefined) bike.variant = variant;
    if (fuelType) bike.fuelType = fuelType;
    if (bikeType) bike.bikeType = bikeType;
    if (color) bike.color = color;
    if (engineSize) bike.engineSize = engineSize;
    if (engineCC !== undefined) bike.engineCC = engineCC;
    
    // Track user-edited fields
    if (userEditedFields) {
      bike.userEditedFields = {
        ...bike.userEditedFields,
        ...userEditedFields
      };
    }
    
    await bike.save();
    
    console.log('✅ Bike details updated successfully');
    
    res.json({
      success: true,
      data: bike,
      message: 'Bike details updated successfully'
    });
  } catch (error) {
    console.error('❌ Error patching bike details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
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

// Enhanced bike lookup with auto-fetch (like cars)
exports.enhancedBikeLookup = async (req, res) => {
  try {
    const { registration } = req.params;
    const { mileage = 0, autoFetch = true } = req.query;

    console.log(`🏍️ Enhanced bike lookup for: ${registration}`);

    // Get basic bike data first
    const basicResult = await lightweightBikeService.getBasicBikeData(registration, mileage);
    
    if (!basicResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found',
        error: basicResult.error
      });
    }

    let enhancedData = basicResult.data;
    let totalCost = basicResult.cost || 0;
    let apiCalls = basicResult.apiCalls || 0;

    // Auto-fetch additional data if requested
    if (autoFetch === 'true' || autoFetch === true) {
      try {
        // CRITICAL: Use Universal Auto Complete Service instead of CheckCarDetailsClient
        // Universal Service handles all vehicle data fetching with proper caching and race condition prevention
        console.log(`🔍 Using Universal Service for enhanced bike data: ${registration}`);
        
        // Create a temporary bike object for the Universal Service
        const tempBike = new Bike({
          registrationNumber: registration,
          mileage: mileage || 10000,
          vehicleType: 'bike',
          dataSource: 'auto-fetch'
        });
        
        // Use Universal Service to get complete bike data
        const completeVehicle = await universalService.completeCarData(tempBike, true); // Use cache for cost optimization
        
        // Merge enhanced data from Universal Service
        enhancedData = {
          ...enhancedData,
          variant: completeVehicle.variant || enhancedData.variant,
          modelVariant: completeVehicle.variant || enhancedData.modelVariant,
          engineSize: completeVehicle.engineSize || enhancedData.engineSize,
          emissionClass: completeVehicle.emissionClass || enhancedData.emissionClass,
          euroStatus: completeVehicle.euroStatus || enhancedData.euroStatus,
          performance: {
            power: completeVehicle.power || null,
            torque: completeVehicle.torque || null,
            acceleration: completeVehicle.acceleration || null,
            topSpeed: completeVehicle.topSpeed || null
          },
          runningCosts: {
            fuelEconomy: {
              urban: completeVehicle.fuelEconomyUrban || enhancedData.runningCosts?.fuelEconomy?.urban,
              extraUrban: completeVehicle.fuelEconomyExtraUrban || enhancedData.runningCosts?.fuelEconomy?.extraUrban,
              combined: completeVehicle.fuelEconomyCombined || enhancedData.runningCosts?.fuelEconomy?.combined
            },
            co2Emissions: completeVehicle.co2Emissions || enhancedData.runningCosts?.co2Emissions,
            insuranceGroup: completeVehicle.insuranceGroup || enhancedData.runningCosts?.insuranceGroup,
            annualTax: completeVehicle.annualTax || enhancedData.runningCosts?.annualTax
          }
        };
        
        console.log(`✅ Universal Service enhanced bike data applied successfully`);
        console.log(`   Variant: ${enhancedData.variant}`);
        console.log(`   Engine Size: ${enhancedData.engineSize}`);
        console.log(`   Running Costs: Combined ${enhancedData.runningCosts?.fuelEconomy?.combined}mpg`);
        console.log(`   Annual Tax: £${enhancedData.runningCosts?.annualTax}`);
        
        totalCost += 0.05; // CheckCarDetails Vehiclespecs cost
        apiCalls += 1;
        
        console.log(`✅ Enhanced bike data fetched for ${registration}`);
      } catch (enhanceError) {
        console.log(`⚠️ Enhanced bike data fetch failed for ${registration}: ${enhanceError.message}`);
      }

      // Auto-fetch MOT history
      try {
          console.log(`🔍 Auto-fetching MOT history for ${registration}`);
          const motResult = await motHistoryService.getMOTHistory(registration);
          
          if (motResult.success && motResult.data) {
            enhancedData.motHistory = motResult.data;
            enhancedData.dataSources = {
              ...enhancedData.dataSources,
              motHistory: true
            };
            console.log(`✅ MOT history fetched for ${registration}: ${motResult.data.length} records`);
          }
        } catch (motError) {
          console.log(`⚠️ MOT history fetch failed for ${registration}: ${motError.message}`);
        }

        // Auto-fetch vehicle history check
        try {
          console.log(`🔍 Auto-fetching vehicle history for ${registration}`);
          const historyResult = await historyService.getVehicleHistory(registration);
          
          if (historyResult.success && historyResult.data) {
            enhancedData.historyCheckData = historyResult.data;
            enhancedData.historyCheckStatus = 'completed';
            enhancedData.historyCheckDate = new Date();
            enhancedData.dataSources = {
              ...enhancedData.dataSources,
              historyCheck: true
            };
            console.log(`✅ Vehicle history fetched for ${registration}`);
          }
        } catch (historyError) {
          console.log(`⚠️ Vehicle history fetch failed for ${registration}: ${historyError.message}`);
        }
    }

    res.json({
      success: true,
      data: enhancedData,
      fromCache: basicResult.fromCache,
      apiCalls,
      cost: totalCost,
      message: `Bike data retrieved successfully${basicResult.fromCache ? ' (cached)' : ''}`
    });

  } catch (error) {
    console.error('Enhanced bike lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Enhanced bike lookup failed',
      error: error.message
    });
  }
};

// Basic bike lookup using optimized DVLA-first approach (FREE API first)
exports.basicBikeLookup = async (req, res) => {
  try {
    console.log('[Bike Controller] ========== BASIC BIKE LOOKUP ==========');
    
    const { registration } = req.params;
    const { mileage } = req.query;
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        error: 'Registration number is required'
      });
    }
    
    console.log(`[Bike Controller] Looking up bike: ${registration} with ${mileage || 'unknown'} miles`);
    
    // Clean registration number
    const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
    const parsedMileage = mileage ? parseInt(mileage, 10) : 50000;
    
    // Get basic bike data using optimized service (FREE DVLA API first)
    const result = await lightweightBikeService.getBasicBikeData(cleanedReg, parsedMileage);
    
    if (!result.success) {
      console.log(`[Bike Controller] API lookup failed: ${result.error}`);
      
      // FALLBACK: Generate mock bike data when APIs fail
      console.log(`[Bike Controller] Generating fallback mock data for ${cleanedReg}`);
      
      const mockBikeData = generateMockBikeData(cleanedReg, parsedMileage);
      
      return res.json({
        success: true,
        data: mockBikeData,
        metadata: {
          fromCache: false,
          apiCalls: 0,
          cost: 0,
          apiProvider: 'mock-fallback',
          note: 'API lookup failed, using generated data. Please verify details.'
        }
      });
    }
    
    console.log(`[Bike Controller] Lookup successful - Cost: £${result.cost}, API: ${result.data.apiProvider}`);
    
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
    console.error('[Bike Controller] Basic lookup error:', error);
    
    // FALLBACK: Generate mock data even on error
    try {
      const { registration } = req.params;
      const { mileage } = req.query;
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      const parsedMileage = mileage ? parseInt(mileage, 10) : 50000;
      
      console.log(`[Bike Controller] Error fallback: Generating mock data for ${cleanedReg}`);
      const mockBikeData = generateMockBikeData(cleanedReg, parsedMileage);
      
      return res.json({
        success: true,
        data: mockBikeData,
        metadata: {
          fromCache: false,
          apiCalls: 0,
          cost: 0,
          apiProvider: 'error-fallback',
          note: 'System error occurred, using generated data. Please verify details.'
        }
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error during bike lookup',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Helper function to generate mock bike data when APIs fail
function generateMockBikeData(registration, mileage) {
  // Extract year from registration if possible
  const yearMatch = registration.match(/[A-Z]{2}(\d{2})/i);
  let year = 2020;
  if (yearMatch) {
    const regYear = parseInt(yearMatch[1]);
    year = regYear >= 50 ? 1950 + regYear : 2000 + regYear;
  }
  
  // Common bike makes and models
  const bikeData = [
    { make: 'Honda', model: 'CBR600RR', type: 'Sport', cc: 600 },
    { make: 'Yamaha', model: 'YZF-R6', type: 'Sport', cc: 600 },
    { make: 'Kawasaki', model: 'Ninja ZX-6R', type: 'Sport', cc: 636 },
    { make: 'Suzuki', model: 'GSX-R600', type: 'Sport', cc: 600 },
    { make: 'Honda', model: 'CB500F', type: 'Naked', cc: 500 },
    { make: 'Yamaha', model: 'MT-07', type: 'Naked', cc: 689 },
    { make: 'BMW', model: 'R1250GS', type: 'Adventure', cc: 1254 },
    { make: 'Triumph', model: 'Street Triple', type: 'Naked', cc: 765 },
    { make: 'Ducati', model: 'Monster', type: 'Naked', cc: 937 },
    { make: 'Harley-Davidson', model: 'Street Glide', type: 'Cruiser', cc: 1746 }
  ];
  
  // Select random bike data
  const randomBike = bikeData[Math.floor(Math.random() * bikeData.length)];
  
  // Generate colors
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Orange', 'Silver', 'Yellow'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Calculate estimated value
  const baseValue = 8000;
  const yearDepreciation = (2024 - year) * 500;
  const mileageDepreciation = Math.floor(mileage / 5000) * 300;
  const estimatedValue = Math.max(baseValue - yearDepreciation - mileageDepreciation, 1500);
  
  // Generate running costs based on engine size
  const combinedMpg = randomBike.cc <= 125 ? 80 + Math.floor(Math.random() * 20) :
                     randomBike.cc <= 500 ? 60 + Math.floor(Math.random() * 15) :
                     randomBike.cc <= 750 ? 45 + Math.floor(Math.random() * 15) :
                     35 + Math.floor(Math.random() * 15);
  
  // Generate urban and extra urban MPG (typically urban is lower, extra urban is higher)
  const urbanMpg = Math.floor(combinedMpg * 0.85) + Math.floor(Math.random() * 5); // ~15% lower than combined
  const extraUrbanMpg = Math.floor(combinedMpg * 1.15) + Math.floor(Math.random() * 5); // ~15% higher than combined
  
  const annualTax = randomBike.cc <= 150 ? 20 :
                   randomBike.cc <= 400 ? 47 :
                   randomBike.cc <= 600 ? 68 :
                   91;
  
  const insuranceGroup = Math.min(20, Math.floor(randomBike.cc / 50) + Math.floor(Math.random() * 5));
  
  return {
    registration: registration,
    mileage: mileage,
    make: randomBike.make,
    model: randomBike.model,
    variant: null,
    year: year,
    color: randomColor,
    fuelType: 'Petrol',
    transmission: 'Manual',
    engineSize: `${(randomBike.cc / 1000).toFixed(1)}L`,
    engineCC: randomBike.cc,
    bikeType: randomBike.type,
    bodyType: 'Motorcycle',
    emissionClass: 'Euro 4',
    co2Emissions: Math.floor(randomBike.cc / 10) + 50 + Math.floor(Math.random() * 20),
    
    // Running costs data
    combinedMpg: combinedMpg,
    urbanMpg: urbanMpg,
    extraUrbanMpg: extraUrbanMpg,
    annualTax: annualTax,
    insuranceGroup: insuranceGroup.toString(),
    
    // Estimated pricing
    estimatedValue: estimatedValue,
    
    // Metadata
    apiProvider: 'mock-generator',
    checkDate: new Date(),
    fromCache: false,
    
    // Additional mock data
    taxStatus: 'Taxed',
    motStatus: 'Valid',
    motExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}
