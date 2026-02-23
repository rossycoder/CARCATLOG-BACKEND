const Car = require('../models/Car');
const TradeSubscription = require('../models/TradeSubscription');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const { normalizeMake } = require('../utils/makeNormalizer');
const { normalizeModelVariant } = require('../utils/modelVariantNormalizer');

// Initialize services
const universalService = new UniversalAutoCompleteService();

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

    // Get most viewed active listings, or recent active listings if no views
    let mostViewed = await Car.find({
      dealerId: req.dealerId,
      isDealerListing: true,
      advertStatus: 'active'
    })
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(5)
      .select('make model year viewCount images price');

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
    
    // CRITICAL: Normalize make to proper capitalization (BMW, Volvo, Mercedes-Benz, etc.)
    // This prevents filter duplicates like "VOLVO" and "Volvo"
    const make = normalizeMake(req.body.make);
    console.log(`[Trade Inventory] Normalized make: "${req.body.make}" → "${make}"`);
    
    // CRITICAL: Normalize model and variant (prevent swaps like model="XC90 R-DESIGN..." variant="XC90")
    const { model: normalizedModel, variant: normalizedVariant, wasSwapped } = normalizeModelVariant(
      req.body.model,
      req.body.variant,
      make
    );
    
    if (wasSwapped) {
      console.log(`[Trade Inventory] Fixed model/variant swap for ${make}`);
    }
    
    // Use dealer's business address postcode if not provided
    const postcode = req.body.postcode || req.dealer.businessAddress?.postcode || 'SW1A 1AA';
    
    // If we have a registration number, fetch enhanced data using Universal Service
    let enhancedData = null;
    if (req.body.registrationNumber || req.body.registration) {
      try {
        // CRITICAL: Use Universal Auto Complete Service instead of CheckCarDetailsClient
        // Universal Service handles all vehicle data fetching with proper caching and race condition prevention
        const registration = req.body.registrationNumber || req.body.registration;
        console.log(`[Trade Inventory] Using Universal Service for enhanced data: ${registration}`);
        
        // Create a temporary vehicle object for the Universal Service
        const tempVehicle = new Car({
          registrationNumber: registration,
          mileage: req.body.mileage || 50000,
          dataSource: 'trade-inventory'
        });
        
        // Use Universal Service to get complete vehicle data
        const completeVehicle = await universalService.completeCarData(tempVehicle, true); // Use cache for cost optimization
        
        // Extract enhanced data in the expected format
        enhancedData = {
          modelVariant: completeVehicle.variant,
          variant: completeVehicle.variant,
          engineSize: completeVehicle.engineSize,
          make: completeVehicle.make,
          model: completeVehicle.model,
          bodyType: completeVehicle.bodyType,
          transmission: completeVehicle.transmission,
          fuelType: completeVehicle.fuelType,
          doors: completeVehicle.doors,
          seats: completeVehicle.seats,
          color: completeVehicle.color,
          co2Emissions: completeVehicle.co2Emissions,
          annualTax: completeVehicle.annualTax,
          insuranceGroup: completeVehicle.insuranceGroup
        };
        
        console.log(`[Trade Inventory] Universal Service enhanced data fetched:`, {
          modelVariant: enhancedData?.modelVariant,
          variant: enhancedData?.variant,
          engineSize: enhancedData?.engineSize
        });
      } catch (error) {
        console.log(`[Trade Inventory] Universal Service could not fetch enhanced data: ${error.message}`);
      }
    }
    
    // Use enhanced engine size if available
    const engineSize = enhancedData?.engineSize || req.body.engineSize;
    console.log(`[Trade Inventory] Engine size: ${engineSize}L (from ${enhancedData?.engineSize ? 'API' : 'request body'})`);
    
    // Auto-generate variant if missing or null
    const vehicleFormatter = require('../utils/vehicleFormatter');
    let variant = req.body.variant;
    
    // Priority: Use enhanced data from API if available
    if (enhancedData?.modelVariant && enhancedData.modelVariant !== 'null' && enhancedData.modelVariant !== 'undefined' && enhancedData.modelVariant.trim() !== '') {
      variant = enhancedData.modelVariant;
      console.log(`[Trade Inventory] Using ModelVariant from CheckCarDetails API: "${variant}"`);
    } else if (enhancedData?.variant && enhancedData.variant !== 'null' && enhancedData.variant !== 'undefined' && enhancedData.variant.trim() !== '') {
      variant = enhancedData.variant;
      console.log(`[Trade Inventory] Using variant from CheckCarDetails API: "${variant}"`);
    } else if (!variant || variant === 'null' || variant === 'undefined' || variant.trim() === '') {
      // Generate variant from vehicle data
      const variantData = {
        make: req.body.make,
        model: req.body.model,
        engineSize: engineSize,
        engineSizeLitres: engineSize,
        fuelType: req.body.fuelType,
        transmission: transmission,
        modelVariant: req.body.modelVariant,
        doors: req.body.doors
      };
      
      variant = vehicleFormatter.formatVariant(variantData);
      console.log('[Trade Inventory] Auto-generated variant:', variant);
    }
    
    // Generate displayTitle in AutoTrader format
    const displayTitleParts = [];
    if (req.body.make) displayTitleParts.push(req.body.make);
    if (req.body.model) displayTitleParts.push(req.body.model);
    if (engineSize) displayTitleParts.push(`${engineSize}L`);
    if (variant) displayTitleParts.push(variant);
    if (transmission) {
      const trans = transmission.charAt(0).toUpperCase() + transmission.slice(1);
      displayTitleParts.push(trans);
    }
    const displayTitle = displayTitleParts.join(' ');
    console.log('[Trade Inventory] Generated displayTitle:', displayTitle);
    
    console.log('[Trade Inventory] Normalized values:', { transmission, postcode, variant, displayTitle, engineSize });
    
    const vehicleData = {
      ...req.body,
      make,                    // Use normalized make (BMW, Volvo, Mercedes-Benz, etc.)
      model: normalizedModel,  // Use normalized model (short name like "XC90", "3 Series")
      variant: normalizedVariant, // Use normalized variant (detailed specs)
      engineSize,              // Use enhanced or request body value
      displayTitle,            // AutoTrader format title
      transmission,            // This will override the spread value
      postcode,                // This will override the spread value
      dealerId: req.dealerId,
      isDealerListing: true,
      advertStatus: 'active',
      publishedAt: new Date(),
      sellerContact: {
        type: 'trade',
        ...req.dealer.businessAddress,
        businessName: req.dealer.businessName,
        tradingName: req.dealer.tradingName,
        businessLogo: req.dealer.logo, // Add dealer logo
        businessWebsite: req.dealer.website, // Add dealer website
        email: req.dealer.email,
        phoneNumber: req.dealer.phone
      }
    };

    console.log('[Trade Inventory] Processed vehicle data:', JSON.stringify(vehicleData, null, 2));

    // CRITICAL: Enhance with electric vehicle data if it's an EV or hybrid
    console.log('[Trade Inventory] Checking if vehicle needs EV enhancement...');
    const enhancedVehicleData = ElectricVehicleEnhancementService.enhanceWithEVData(vehicleData);
    console.log('[Trade Inventory] EV enhancement complete');

    const vehicle = new Car(enhancedVehicleData);
    
    // CRITICAL: Normalize model/variant BEFORE saving
    // This ensures proper organization in filter sidebar
    const makeUpper = vehicle.make ? vehicle.make.toUpperCase() : '';
    const modelStr = vehicle.model ? vehicle.model.trim() : '';
    const variantStr = vehicle.variant ? vehicle.variant.trim() : '';
    
    // Volkswagen: Golf GTE → Golf, Polo Match → Polo
    if (makeUpper === 'VOLKSWAGEN') {
      if (modelStr.startsWith('Golf ') && modelStr !== 'Golf') {
        const variantPart = modelStr.replace('Golf ', '').trim();
        console.log(`🔄 [Normalization] VW Golf: "${modelStr}" → "Golf", variant: "${variantPart}"`);
        vehicle.model = 'Golf';
        vehicle.variant = variantPart || variantStr;
      } else if (modelStr.startsWith('Polo ') && modelStr !== 'Polo') {
        const variantPart = modelStr.replace('Polo ', '').trim();
        console.log(`🔄 [Normalization] VW Polo: "${modelStr}" → "Polo", variant: "${variantPart}"`);
        vehicle.model = 'Polo';
        vehicle.variant = variantPart || variantStr;
      }
    }
    
    // Audi: A3 Black 35 TFSI → A3
    if (makeUpper === 'AUDI') {
      const audiModelPattern = /^(A[1-8]|Q[2-8]|TT|R8)\s+(.+)$/i;
      const match = modelStr.match(audiModelPattern);
      if (match) {
        const baseModel = match[1];
        const variantPart = match[2];
        console.log(`🔄 [Normalization] Audi: "${modelStr}" → "${baseModel}", variant: "${variantPart}"`);
        vehicle.model = baseModel;
        vehicle.variant = variantPart || variantStr;
      }
    }
    
    // Mercedes-Benz: C 300 AMG → C-Class, E 300 → E-Class
    if (makeUpper === 'MERCEDES-BENZ' || makeUpper === 'MERCEDES') {
      if (!modelStr.includes('-Class')) {
        const mercedesPattern = /^([ABCEGMS])\s*(\d{3})/i;
        const match = modelStr.match(mercedesPattern);
        if (match) {
          const classLetter = match[1].toUpperCase();
          const baseModel = `${classLetter}-Class`;
          console.log(`🔄 [Normalization] Mercedes: "${modelStr}" → "${baseModel}"`);
          vehicle.model = baseModel;
          if (!variantStr || variantStr === modelStr) {
            vehicle.variant = modelStr;
          }
        }
      }
    }
    
    // Body Type Capitalization: HATCHBACK → Hatchback
    if (vehicle.bodyType) {
      const normalized = vehicle.bodyType.charAt(0).toUpperCase() + vehicle.bodyType.slice(1).toLowerCase();
      if (vehicle.bodyType !== normalized) {
        console.log(`🔄 [Normalization] Body type: "${vehicle.bodyType}" → "${normalized}"`);
        vehicle.bodyType = normalized;
      }
    }
    
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
    console.log('[Trade Publish] Request body keys:', Object.keys(req.body));
    console.log('[Trade Publish] Authenticated dealer:', {
      id: req.dealerId,
      businessName: req.dealer?.businessName
    });

    const { advertId, contactDetails, dealerId, advertData } = req.body;

    console.log('[Trade Publish] ===== DEBUG DATA =====');
    console.log('[Trade Publish] advertData received:', !!advertData);
    if (advertData) {
      console.log('[Trade Publish] advertData.images:', advertData.images ? advertData.images.length : 'NONE');
      console.log('[Trade Publish] advertData.description:', advertData.description ? 'YES' : 'NONE');
      console.log('[Trade Publish] advertData keys:', Object.keys(advertData));
    }
    console.log('[Trade Publish] ===== END DEBUG =====');

    // Validation: Check required fields
    const validationErrors = [];
    
    if (!advertId) {
      validationErrors.push('Advert ID is required');
    }
    
    if (!contactDetails) {
      validationErrors.push('Contact details are required');
    } else {
      if (!contactDetails.phoneNumber || !contactDetails.phoneNumber.trim()) {
        validationErrors.push('Phone number is required');
      }
      if (!contactDetails.email || !contactDetails.email.trim()) {
        validationErrors.push('Email is required');
      }
      if (!contactDetails.postcode || !contactDetails.postcode.trim()) {
        validationErrors.push('Postcode is required');
      }
    }
    
    if (validationErrors.length > 0) {
      console.log('[Trade Publish] Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Verify dealer matches authenticated user
    if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
      console.log('[Trade Publish] Unauthorized: dealer mismatch');
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Dealer ID mismatch' 
      });
    }

    // Find the car by advertId (UUID) or _id (MongoDB ObjectId)
    let car;
    
    // Check if it's a MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
      console.log('[Trade Publish] Searching by MongoDB _id:', advertId);
      car = await Car.findById(advertId);
    } else {
      console.log('[Trade Publish] Searching by advertId (UUID):', advertId);
      car = await Car.findOne({ advertId });
    }
    
    if (!car) {
      console.log('[Trade Publish] Vehicle not found:', advertId);
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }

    console.log('[Trade Publish] Found vehicle:', car._id);
    console.log('[Trade Publish] Current images:', car.images ? car.images.length : 0);

    // Prepare update data
    const updateData = {
      postcode: contactDetails.postcode,
      dealerId: req.dealerId,
      isDealerListing: true,
      sellerType: 'dealer',
      advertStatus: 'active',
      publishedAt: new Date()
    };
    
    // CRITICAL: Fetch location data from postcode for radius-based search
    // Use dealer's business postcode if contactDetails postcode is default/invalid
    let postcodeToUse = contactDetails.postcode;
    
    // If postcode is default hardcoded value, use dealer's business postcode
    if (postcodeToUse === 'SW1A 1AA' && req.dealer.businessAddress?.postcode) {
      postcodeToUse = req.dealer.businessAddress.postcode;
      updateData.postcode = postcodeToUse;
      console.log(`[Trade Publish] Using dealer's business postcode: ${postcodeToUse}`);
    }
    
    try {
      console.log(`[Trade Publish] 🔍 Fetching location data for postcode: ${postcodeToUse}`);
      const postcodeService = require('../services/postcodeService');
      const locationData = await postcodeService.lookupPostcode(postcodeToUse);
      
      if (locationData) {
        updateData.locationName = locationData.locationName;
        updateData.latitude = locationData.latitude;
        updateData.longitude = locationData.longitude;
        console.log(`[Trade Publish] ✅ Location data fetched: ${locationData.locationName} (${locationData.latitude}, ${locationData.longitude})`);
      } else {
        console.log(`[Trade Publish] ⚠️  Location data not available for postcode: ${contactDetails.postcode}`);
      }
    } catch (error) {
      console.error(`[Trade Publish] ❌ Location fetch failed: ${error.message}`);
      // Continue with publish even if location fetch fails
    }

    // ALWAYS use images from advertData if provided (these are the dealer's uploaded images)
    // Frontend sends photos array, backend needs images array
    if (advertData && advertData.photos && advertData.photos.length > 0) {
      console.log('[Trade Publish] Using photos from advertData:', advertData.photos.length);
      // Convert photos array (with url property) to images array (just URLs)
      updateData.images = advertData.photos.map(photo => photo.url || photo);
    } else if (advertData && advertData.images && advertData.images.length > 0) {
      console.log('[Trade Publish] Using images from advertData:', advertData.images.length);
      updateData.images = advertData.images;
    }

    // ALWAYS use description from advertData if provided
    if (advertData && advertData.description && advertData.description.trim() !== '') {
      console.log('[Trade Publish] Using description from advertData');
      updateData.description = advertData.description;
    }

    // ALWAYS use other important fields from advertData if they exist
    if (advertData) {
      const fieldsToUpdate = ['features', 'condition', 'serviceHistory', 'owners'];
      fieldsToUpdate.forEach(field => {
        if (advertData[field]) {
          console.log(`[Trade Publish] Using ${field} from advertData`);
          updateData[field] = advertData[field];
        }
      });
    }

    // CRITICAL: Normalize make to proper capitalization (VOLVO → Volvo, bmw → BMW, etc.)
    // This prevents filter duplicates in frontend
    if (car.make) {
      const normalizedMake = normalizeMake(car.make);
      if (car.make !== normalizedMake) {
        console.log(`[Trade Publish] 🔄 Normalizing make: "${car.make}" → "${normalizedMake}"`);
        updateData.make = normalizedMake;
      }
    }
    
    // CRITICAL: Normalize model and variant (fix swaps)
    if (car.model) {
      const { model: normalizedModel, variant: normalizedVariant, wasSwapped } = normalizeModelVariant(
        car.model,
        car.variant,
        car.make
      );
      
      if (wasSwapped) {
        console.log(`[Trade Publish] 🔄 Fixed model/variant swap`);
        updateData.model = normalizedModel;
        updateData.variant = normalizedVariant;
      }
    }
    
    // CRITICAL: Normalize BMW series models BEFORE publishing (318d → 3 Series)
    if (car.make && car.make.toUpperCase() === 'BMW' && car.model) {
      console.log(`[Trade Publish] Checking BMW normalization for: ${car.model}`);
      
      // Skip electric models (i4, i8, iX, iX3, etc.)
      const isElectricModel = /^i[X0-9]/i.test(car.model);
      
      if (!isElectricModel) {
        // Match: "320d", "520i", "118i M", "320d M Sport", "M135", etc.
        // Pattern: first digit (1-8) + two digits + anything else
        const seriesMatch = car.model.match(/^([1-8])(\d{2})(.*)$/i);
        
        if (seriesMatch) {
          const seriesNumber = seriesMatch[1]; // First digit (1, 2, 3, 4, 5, 6, 7, 8)
          const seriesModel = `${seriesNumber} Series`;
          const fullVariant = car.model.trim(); // Full variant like "320d" or "118i M"
          
          console.log(`[Trade Publish] 🔄 Normalizing BMW model: "${car.model}" → "${seriesModel}"`);
          updateData.model = seriesModel;
          
          // Update variant if it's empty, same as model, or is a fuel type (fallback variant)
          const isFuelTypeVariant = car.variant && ['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(car.variant);
          if (!car.variant || car.variant === car.model || car.variant === 'null' || car.variant === 'undefined' || isFuelTypeVariant) {
            updateData.variant = fullVariant;
            console.log(`[Trade Publish] 🔄 Setting variant to: "${fullVariant}"`);
          }
        } else {
          console.log(`[Trade Publish] ℹ️  BMW model "${car.model}" doesn't match series pattern, keeping as-is`);
        }
      } else {
        console.log(`[Trade Publish] ⚡ Electric BMW model detected, skipping normalization: ${car.model}`);
      }
    }
    
    // CRITICAL: Fetch vehicle history and MOT history for trade dealers
    if (car.registrationNumber) {
      try {
        console.log(`[Trade Publish] 🔍 Fetching vehicle history for: ${car.registrationNumber}`);
        const HistoryService = require('../services/historyService');
        const historyService = new HistoryService();
        
        // Fetch vehicle history (this will save to VehicleHistory model)
        const historyResult = await historyService.checkVehicleHistory(car.registrationNumber, false);
        
        if (historyResult && historyResult._id) {
          updateData.historyCheckId = historyResult._id; // CRITICAL: Use _id, not historyCheckId
          updateData.historyCheckStatus = 'completed';
          console.log(`[Trade Publish] ✅ Vehicle history fetched: ${historyResult._id}`);
        } else {
          console.log(`[Trade Publish] ⚠️  Vehicle history not available`);
        }
      } catch (error) {
        console.error(`[Trade Publish] ❌ Vehicle history fetch failed: ${error.message}`);
        // Continue with publish even if history fetch fails
      }
      
      try {
        console.log(`[Trade Publish] 🔍 Fetching MOT history for: ${car.registrationNumber}`);
        const motHistoryService = require('../services/motHistoryService');
        
        // Fetch MOT history from CheckCarDetails API
        const motHistory = await motHistoryService.fetchMOTHistory(car.registrationNumber);
        
        if (motHistory && motHistory.length > 0) {
          updateData.motHistory = motHistory;
          
          // Set MOT due date from latest test
          const latestTest = motHistory[0];
          if (latestTest.expiryDate) {
            updateData.motDue = new Date(latestTest.expiryDate);
            updateData.motExpiry = new Date(latestTest.expiryDate);
            updateData.motStatus = latestTest.testResult || 'Valid';
            console.log(`[Trade Publish] ✅ MOT history fetched: ${motHistory.length} tests`);
            console.log(`[Trade Publish] ✅ MOT expiry: ${latestTest.expiryDate}`);
          }
        } else {
          console.log(`[Trade Publish] ⚠️  MOT history not available`);
        }
      } catch (error) {
        console.error(`[Trade Publish] ❌ MOT history fetch failed: ${error.message}`);
        // Continue with publish even if MOT fetch fails
      }
    }
    
    // CRITICAL: Build complete sellerContact object to avoid dot notation issues
    const sellerContact = {
      phoneNumber: contactDetails.phoneNumber,
      email: contactDetails.email,
      allowEmailContact: contactDetails.allowEmailContact || false,
      postcode: contactDetails.postcode,
      type: 'trade',
      businessName: req.dealer.businessName,
      tradingName: req.dealer.tradingName
    };
    
    // Add logo if exists
    if (req.dealer.logo) {
      sellerContact.businessLogo = req.dealer.logo;
      console.log('[Trade Publish] Adding dealer logo:', req.dealer.logo);
    }
    
    // Add website if exists
    if (req.dealer.website) {
      sellerContact.businessWebsite = req.dealer.website;
      console.log('[Trade Publish] Adding dealer website:', req.dealer.website);
    }
    
    // Add business address if exists
    if (req.dealer.businessAddress) {
      sellerContact.businessAddress = req.dealer.businessAddress;
      console.log('[Trade Publish] Adding dealer address:', req.dealer.businessAddress);
    }
    
    // Update with complete sellerContact object
    updateData.sellerContact = sellerContact;
    
    // Remove dot notation fields (they're now in sellerContact object)
    delete updateData['sellerContact.phoneNumber'];
    delete updateData['sellerContact.email'];
    delete updateData['sellerContact.allowEmailContact'];
    delete updateData['sellerContact.postcode'];
    delete updateData['sellerContact.type'];
    delete updateData['sellerContact.businessName'];
    delete updateData['sellerContact.tradingName'];
    delete updateData['sellerContact.businessLogo'];
    delete updateData['sellerContact.businessWebsite'];
    delete updateData['sellerContact.businessAddress'];
    
    // CRITICAL: Normalize fuel type using Universal Service (handles "Diesel/Electric" → "Diesel Hybrid")
    console.log('[Trade Publish] Checking fuel type normalization...');
    console.log('[Trade Publish] Current fuel type:', car.fuelType);
    
    if (car.fuelType) {
      const normalizedFuelType = universalService.normalizeFuelType(car.fuelType, null);
      if (normalizedFuelType !== car.fuelType) {
        console.log(`[Trade Publish] 🔄 Normalizing fuel type: "${car.fuelType}" → "${normalizedFuelType}"`);
        updateData.fuelType = normalizedFuelType;
      }
    }
    
    // CRITICAL: Enhance with electric vehicle data if it's an EV or hybrid
    console.log('[Trade Publish] Checking if vehicle needs EV enhancement...');
    
    // Merge car data with updateData to get complete vehicle data
    const completeVehicleData = {
      ...car.toObject(),
      ...updateData
    };
    
    // Apply EV enhancement
    const enhancedVehicleData = ElectricVehicleEnhancementService.enhanceWithEVData(completeVehicleData);
    
    // Extract only the EV-related fields to update
    if (enhancedVehicleData.electricRange || enhancedVehicleData.batteryCapacity) {
      console.log('[Trade Publish] ✅ EV enhancement applied');
      updateData.electricRange = enhancedVehicleData.electricRange;
      updateData.batteryCapacity = enhancedVehicleData.batteryCapacity;
      updateData.chargingTime = enhancedVehicleData.chargingTime;
      updateData.homeChargingSpeed = enhancedVehicleData.homeChargingSpeed;
      updateData.publicChargingSpeed = enhancedVehicleData.publicChargingSpeed;
      updateData.rapidChargingSpeed = enhancedVehicleData.rapidChargingSpeed;
      updateData.chargingTime10to80 = enhancedVehicleData.chargingTime10to80;
      updateData.electricMotorPower = enhancedVehicleData.electricMotorPower;
      updateData.electricMotorTorque = enhancedVehicleData.electricMotorTorque;
      updateData.chargingPortType = enhancedVehicleData.chargingPortType;
      updateData.fastChargingCapability = enhancedVehicleData.fastChargingCapability;
      updateData.isHybrid = enhancedVehicleData.isHybrid;
      updateData.isPluginHybrid = enhancedVehicleData.isPluginHybrid;
      updateData.runningCosts = enhancedVehicleData.runningCosts;
      updateData.features = enhancedVehicleData.features;
      
      console.log('[Trade Publish] EV data added:', {
        electricRange: updateData.electricRange,
        batteryCapacity: updateData.batteryCapacity,
        chargingPortType: updateData.chargingPortType
      });
    } else {
      console.log('[Trade Publish] ℹ️  No EV enhancement needed (not an EV/hybrid)');
    }
    
    // SIMPLE UPDATE - Just set the fields we need, PRESERVE existing images
    const updateResult = await Car.updateOne(
      { _id: car._id },
      { $set: updateData },
      { runValidators: false }
    );
    
    console.log('[Trade Publish] Update result:', updateResult);
    console.log('[Trade Publish] ========== PUBLISH SUCCESS ==========');
    
    res.json({
      success: true,
      data: {
        vehicleId: car._id,
        advertId: car.advertId,
        status: 'active'
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
