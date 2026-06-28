const Car = require('../models/Car');
const TradeSubscription = require('../models/TradeSubscription');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const { normalizeMake } = require('../utils/makeNormalizer');
const { normalizeModelVariant } = require('../utils/modelVariantNormalizer');
const EmailService = require('../services/emailService');
const { carListingSuccessEmail } = require('../utils/emailTemplates');
const emailService = new EmailService();

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

    // Filter by status
    if (status) {
      query.advertStatus = status;
    }
    // No status filter = show all (active, sold, draft)

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
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory'
    });
  }
};

/**
 * Get inventory stats (Cars, Bikes, Vans combined)
 * GET /api/trade/inventory/stats
 */
exports.getStats = async (req, res) => {
  try {
    const Bike = require('../models/Bike');
    const Van = require('../models/Van');
    
    // Fetch stats from all three collections in parallel
    const [carStats, bikeStats, vanStats] = await Promise.all([
      // Car stats
      Car.aggregate([
        { $match: { dealerId: req.dealerId, isDealerListing: true } },
        {
          $group: {
            _id: '$advertStatus',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' }
          }
        }
      ]),
      
      // Bike stats
      Bike.aggregate([
        { $match: { dealerId: req.dealerId, isDealerListing: true } },
        {
          $group: {
            _id: '$advertStatus',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' }
          }
        }
      ]),
      
      // Van stats
      Van.aggregate([
        { $match: { dealerId: req.dealerId, isDealerListing: true } },
        {
          $group: {
            _id: '$advertStatus',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' }
          }
        }
      ])
    ]);

    // Combine stats from all vehicle types
    const combinedStats = {};
    let totalViewsCount = 0;
    
    [...carStats, ...bikeStats, ...vanStats].forEach(stat => {
      const status = stat._id;
      combinedStats[status] = (combinedStats[status] || 0) + stat.count;
      totalViewsCount += stat.totalViews || 0;
    });

    // Get most viewed active listings from all vehicle types
    const [carsMostViewed, bikesMostViewed, vansMostViewed] = await Promise.all([
      Car.find({
        dealerId: req.dealerId,
        isDealerListing: true,
        advertStatus: 'active'
      })
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(5)
        .select('make model year viewCount images price')
        .lean(),
      
      Bike.find({
        dealerId: req.dealerId,
        isDealerListing: true,
        advertStatus: 'active'
      })
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(5)
        .select('make model year viewCount images price')
        .lean(),
      
      Van.find({
        dealerId: req.dealerId,
        isDealerListing: true,
        advertStatus: 'active'
      })
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(5)
        .select('make model year viewCount images price')
        .lean()
    ]);

    // Combine and sort most viewed from all types
    const allMostViewed = [...carsMostViewed, ...bikesMostViewed, ...vansMostViewed]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    const totalVehicles = Object.values(combinedStats).reduce((sum, count) => sum + count, 0);

    // Calculate totals by vehicle type (not just status)
    const totalCars = carStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalBikes = bikeStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalVans = vanStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      stats: {
        total: totalVehicles,
        active: combinedStats.active || 0,
        sold: combinedStats.sold || 0,
        draft: combinedStats.draft || 0,
        expired: combinedStats.expired || 0,
        totalViews: totalViewsCount,
        mostViewed: allMostViewed,
        // Add vehicle type totals
        cars: totalCars,
        bikes: totalBikes,
        vans: totalVans
      }
    });
  } catch (error) {
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
    
    // CRITICAL: Normalize model and variant (prevent swaps like model="XC90 R-DESIGN..." variant="XC90")
    const { model: normalizedModel, variant: normalizedVariant, wasSwapped } = normalizeModelVariant(
      req.body.model,
      req.body.variant,
      make
    );
    
    if (wasSwapped) {
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
        
        // Check if data already cached
        const safeAPI = require('../services/safeAPIService');
        const summary = await safeAPI.getVehicleSummary(registration);
        
        if (summary && summary.hasCachedData) {
          
          // Load cached data from VehicleHistory
          const VehicleHistory = require('../models/VehicleHistory');
          const cached = await VehicleHistory.findOne({ vrm: registration.toUpperCase().replace(/\s/g, '') })
            .sort({ checkDate: -1 })
            .lean();
          
          if (cached) {
            enhancedData = {
              modelVariant: cached.variant,
              variant: cached.variant,
              engineSize: cached.engineSize,
              make: cached.make,
              model: cached.model,
              bodyType: cached.bodyType,
              transmission: cached.transmission,
              fuelType: cached.fuelType,
              doors: cached.doors,
              seats: cached.seats,
              color: cached.color,
              co2Emissions: cached.co2Emissions,
              annualTax: cached.annualTax,
              insuranceGroup: cached.insuranceGroup
            };
            
          }
        } else {
          
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
        }
        
      } catch (error) {
      }
    }
    
    // Use enhanced engine size if available
    const engineSize = enhancedData?.engineSize || req.body.engineSize;
    
    // Auto-generate variant if missing or null
    const vehicleFormatter = require('../utils/vehicleFormatter');
    let variant = req.body.variant;
    
    // Priority: Use enhanced data from API if available
    if (enhancedData?.modelVariant && enhancedData.modelVariant !== 'null' && enhancedData.modelVariant !== 'undefined' && enhancedData.modelVariant.trim() !== '') {
      variant = enhancedData.modelVariant;
    } else if (enhancedData?.variant && enhancedData.variant !== 'null' && enhancedData.variant !== 'undefined' && enhancedData.variant.trim() !== '') {
      variant = enhancedData.variant;
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
      // Auto-classify: current year + mileage <= 300 = new car
      condition: (() => {
        const currentYear = new Date().getFullYear();
        const carYear = parseInt(req.body.year);
        const carMileage = parseInt(req.body.mileage) || 0;
        return (carYear === currentYear && carMileage <= 300) ? 'new' : 'used';
      })(),
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


    // CRITICAL: Enhance with electric vehicle data if it's an EV or hybrid
    const enhancedVehicleData = ElectricVehicleEnhancementService.enhanceWithEVData(vehicleData);

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
        vehicle.model = 'Golf';
        vehicle.variant = variantPart || variantStr;
      } else if (modelStr.startsWith('Polo ') && modelStr !== 'Polo') {
        const variantPart = modelStr.replace('Polo ', '').trim();
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
        vehicle.bodyType = normalized;
      }
    }
    
    await vehicle.save();
    // NOTE: MOT + History API handled by Car.js pre-save hook (Step 6b)
    // when advertStatus = 'active' and motHistory/historyCheckId missing.
    // No duplicate call needed here.

    // Increment subscription usage
    await req.subscription.incrementListingCount();

    // Update dealer stats
    await req.dealer.updateStats();

    // Send car listing confirmation email to trade dealer
    try {
      const carDetails = {
        id: vehicle._id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration: vehicle.registrationNumber,
        price: vehicle.price
      };
      const emailTemplate = carListingSuccessEmail(
        req.dealer.businessName,
        req.dealer.email,
        carDetails
      );
      await emailService.sendEmail(
        req.dealer.email,
        emailTemplate.subject,
        emailTemplate.text,
        emailTemplate.html
      );
    } catch (emailError) {
      // Don't block the response if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle
    });
  } catch (error) {
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

    // ✅ Use deleteCarWithCleanup to cascade delete FeedVehicle and FeedImage
    const deleteResult = await Car.deleteCarWithCleanup(vehicle._id);
    
    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: deleteResult.error || 'Failed to delete vehicle'
      });
    }

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

    // Fix any invalid historyCheckStatus values before saving
    if (vehicle.historyCheckStatus && !['pending', 'verified', 'failed', 'not_required'].includes(vehicle.historyCheckStatus)) {
      vehicle.historyCheckStatus = 'not_required';
    }

    vehicle.advertStatus = 'sold';
    vehicle.soldAt = new Date();
    
    // Save with validation disabled to avoid enum errors on old data
    await vehicle.save({ validateBeforeSave: false });

    // Decrement subscription usage if was active
    if (wasActive && req.subscription) {
      await req.subscription.decrementListingCount();
    }

    // Update dealer stats
    if (req.dealer) {
      await req.dealer.updateStats();
    }

    res.json({
      success: true,
      message: 'Vehicle marked as sold',
      vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking vehicle as sold',
      error: error.message
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

    const { advertId, contactDetails, dealerId, advertData } = req.body;

    if (advertData) {
    }

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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Verify dealer matches authenticated user
    if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Dealer ID mismatch' 
      });
    }

    // Find the car by advertId (UUID) or _id (MongoDB ObjectId)
    let car;
    
    // Check if it's a MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
      car = await Car.findById(advertId);
    } else {
      car = await Car.findOne({ advertId });
    }
    
    if (!car) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }


    // Prepare update data
    const updateData = {
      postcode: contactDetails.postcode,
      dealerId: req.dealerId,
      isDealerListing: true,
      sellerType: 'dealer',
      advertStatus: 'active',
      publishedAt: new Date(),
      // Set dealer email so car appears correctly (pre-save hook requires userId or email)
      email: req.dealer.email
    };
    
    // CRITICAL: Fetch location data from postcode for radius-based search
    // Use dealer's business postcode if contactDetails postcode is default/invalid
    let postcodeToUse = contactDetails.postcode;
    
    // If postcode is default hardcoded value, use dealer's business postcode
    if (postcodeToUse === 'SW1A 1AA' && req.dealer.businessAddress?.postcode) {
      postcodeToUse = req.dealer.businessAddress.postcode;
      updateData.postcode = postcodeToUse;
    }
    
    try {
      const postcodeService = require('../services/postcodeService');
      const locationData = await postcodeService.lookupPostcode(postcodeToUse);
      
      if (locationData) {
        updateData.locationName = locationData.locationName;
        updateData.latitude = locationData.latitude;
        updateData.longitude = locationData.longitude;
      } else {
      }
    } catch (error) {
      // Continue with publish even if location fetch fails
    }

    // ALWAYS use images from advertData if provided (these are the dealer's uploaded images)
    // Frontend sends photos array, backend needs images array
    if (advertData && advertData.photos && advertData.photos.length > 0) {
      // Convert photos array (with url property) to images array (just URLs)
      updateData.images = advertData.photos.map(photo => photo.url || photo);
    } else if (advertData && advertData.images && advertData.images.length > 0) {
      updateData.images = advertData.images;
    }

    // ALWAYS use description from advertData if provided
    if (advertData && advertData.description && advertData.description.trim() !== '') {
      updateData.description = advertData.description;
    }

    // ALWAYS use other important fields from advertData if they exist
    if (advertData) {
      const fieldsToUpdate = ['features', 'condition', 'serviceHistory', 'owners'];
      fieldsToUpdate.forEach(field => {
        if (advertData[field]) {
          updateData[field] = advertData[field];
        }
      });
    }

    // Auto-classify condition based on year + mileage rules
    // New car = current year registration + mileage <= 300
    const currentYear = new Date().getFullYear();
    const carYear = car.year || updateData.year;
    const carMileage = car.mileage ?? updateData.mileage;
    if (carYear === currentYear && carMileage <= 300) {
      updateData.condition = 'new';
    } else if (!updateData.condition) {
      updateData.condition = 'used';
    }

    // CRITICAL: Normalize make to proper capitalization (VOLVO → Volvo, bmw → BMW, etc.)
    // This prevents filter duplicates in frontend
    if (car.make) {
      const normalizedMake = normalizeMake(car.make);
      if (car.make !== normalizedMake) {
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
        updateData.model = normalizedModel;
        updateData.variant = normalizedVariant;
      }
    }
    
    // CRITICAL: Normalize BMW series models BEFORE publishing (318d → 3 Series)
    if (car.make && car.make.toUpperCase() === 'BMW' && car.model) {
      
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
          
          updateData.model = seriesModel;
          
          // Update variant if it's empty, same as model, or is a fuel type (fallback variant)
          const isFuelTypeVariant = car.variant && ['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(car.variant);
          if (!car.variant || car.variant === car.model || car.variant === 'null' || car.variant === 'undefined' || isFuelTypeVariant) {
            updateData.variant = fullVariant;
          }
        } else {
        }
      } else {
      }
    }
    
    // Fetch vehicle history and MOT — only if NOT already done in createVehicle
    if (car.registrationNumber) {
      const { fetchVehicleAPIs } = require('../utils/fetchVehicleAPIs');

      const needsHistory = !car.historyCheckId;
      const needsMOT     = !car.motHistory || car.motHistory.length === 0;

      if (needsHistory || needsMOT) {
        try {
          const apiData = await fetchVehicleAPIs(car.registrationNumber, false); // use cache

          if (needsMOT && apiData.motHistory?.length) {
            updateData.motHistory = apiData.motHistory;
            updateData.motDue     = apiData.motDue;
            updateData.motExpiry  = apiData.motExpiry;
            updateData.motStatus  = apiData.motStatus;
          }
          if (needsHistory && apiData.historyCheckId) {
            updateData.historyCheckId     = apiData.historyCheckId;
            updateData.historyCheckStatus = apiData.historyCheckStatus;
            updateData.historyCheckDate   = apiData.historyCheckDate;
          }
        } catch (error) {
        }
      } else {
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
    }
    
    // Add website if exists
    if (req.dealer.website) {
      sellerContact.businessWebsite = req.dealer.website;
    }
    
    // Add business address if exists
    if (req.dealer.businessAddress) {
      sellerContact.businessAddress = req.dealer.businessAddress;
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
    
    if (car.fuelType) {
      const normalizedFuelType = universalService.normalizeFuelType(car.fuelType, null);
      if (normalizedFuelType !== car.fuelType) {
        updateData.fuelType = normalizedFuelType;
      }
    }
    
    // CRITICAL: Enhance with electric vehicle data if it's an EV or hybrid
    
    // Merge car data with updateData to get complete vehicle data
    const completeVehicleData = {
      ...car.toObject(),
      ...updateData
    };
    
    // Apply EV enhancement
    const enhancedVehicleData = ElectricVehicleEnhancementService.enhanceWithEVData(completeVehicleData);
    
    // Extract only the EV-related fields to update
    if (enhancedVehicleData.electricRange || enhancedVehicleData.batteryCapacity) {
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
      
    } else {
    }
    
    // SIMPLE UPDATE - Just set the fields we need, PRESERVE existing images
    const updateResult = await Car.updateOne(
      { _id: car._id },
      { $set: updateData },
      { runValidators: false }
    );
    
    
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
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish vehicle',
      error: error.message
    });
  }
};

/**
 * Charge £2.50 for car listing during trial period
 * POST /api/trade/inventory/charge-trial-listing
 */
exports.chargeTrialListing = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Get active subscription
    const subscription = await TradeSubscription.findOne({
      dealerId: req.dealerId,
      status: { $in: ['active', 'trialing'] }
    }).populate('plan');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Check if in trial period
    if (!subscription.isTrialing) {
      return res.json({
        success: true,
        message: 'Not in trial period, no charge needed',
        charged: false
      });
    }
    
    // Charge £2.50 using Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 250, // £2.50 in pence
      currency: 'gbp',
      customer: subscription.stripeCustomerId,
      description: `Trial listing charge for vehicle ${vehicleId}`,
      metadata: {
        dealerId: req.dealerId.toString(),
        vehicleId: vehicleId,
        subscriptionId: subscription._id.toString(),
        chargeType: 'trial_listing'
      },
      payment_method: subscription.stripePaymentMethodId,
      off_session: true,
      confirm: true
    });
    
    
    res.json({
      success: true,
      message: 'Trial listing charge successful',
      charged: true,
      amount: 2.50,
      chargeId: paymentIntent.id
    });
  } catch (error) {
    // Don't block listing if charge fails
    res.json({
      success: true,
      message: 'Listing created but charge failed - will retry',
      charged: false,
      error: error.message
    });
  }
};
