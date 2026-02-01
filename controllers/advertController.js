const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');

/**
 * Create a new advert and save to database immediately
 */
const createAdvert = async (req, res) => {
  try {
    console.log('📝 [createAdvert] Request received');
    console.log('📝 [createAdvert] Request body keys:', Object.keys(req.body));
    
    const { vehicleData } = req.body;
    
    if (!vehicleData) {
      console.error('❌ [createAdvert] Missing vehicleData in request body');
      return res.status(400).json({
        success: false,
        message: 'Vehicle data is required',
        receivedKeys: Object.keys(req.body)
      });
    }
    
    const advertId = uuidv4();
    console.log(`📝 [createAdvert] Creating advert with ID: ${advertId}`);
    
    // Calculate estimated price with fallback
    let estimatedPrice = 10000; // Default fallback
    
    try {
      if (vehicleData.privatePrice && vehicleData.privatePrice > 0) {
        estimatedPrice = vehicleData.privatePrice;
      } else if (vehicleData.estimatedValue) {
        if (typeof vehicleData.estimatedValue === 'object') {
          estimatedPrice = vehicleData.estimatedValue.private || 
                          vehicleData.estimatedValue.retail || 
                          vehicleData.estimatedValue.trade || 10000;
        } else {
          estimatedPrice = vehicleData.estimatedValue;
        }
      } else {
        // Simple calculation based on year and mileage
        const currentYear = new Date().getFullYear();
        const vehicleYear = parseInt(vehicleData.year) || currentYear;
        const vehicleAge = currentYear - vehicleYear;
        const mileage = parseInt(vehicleData.mileage) || 0;
        
        let baseValue = 15000;
        baseValue -= (vehicleAge * 1000);
        baseValue -= Math.floor(mileage / 10000) * 500;
        estimatedPrice = Math.max(baseValue, 1000);
      }
    } catch (priceError) {
      console.warn('⚠️  [createAdvert] Price calculation error, using default:', priceError.message);
      estimatedPrice = 10000;
    }
    
    console.log(`💰 [createAdvert] Estimated price: £${estimatedPrice}`);
    
    // Create car with minimal required fields
    const car = new Car({
      advertId: advertId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      variant: vehicleData.variant || null,
      year: parseInt(vehicleData.year) || new Date().getFullYear(),
      mileage: parseInt(vehicleData.mileage) || 0,
      color: vehicleData.color || 'Not specified',
      fuelType: vehicleData.fuelType || 'Petrol',
      transmission: vehicleData.transmission || 'manual',
      price: estimatedPrice,
      estimatedValue: estimatedPrice,
      description: '',
      images: [],
      registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
      engineSize: parseFloat(vehicleData.engineSize) || undefined,
      bodyType: vehicleData.bodyType || undefined,
      doors: parseInt(vehicleData.doors) || undefined,
      seats: parseInt(vehicleData.seats) || undefined,
      dataSource: vehicleData.registration ? 'DVLA' : 'manual',
      advertStatus: 'active',
      publishedAt: new Date(),
      condition: 'used',
      postcode: vehicleData.postcode || undefined,
      sellerContact: {
        email: vehicleData.email || undefined,
        phoneNumber: vehicleData.phoneNumber || undefined,
        allowEmailContact: false
      }
    });
    
    console.log(`💾 [createAdvert] Saving car to database...`);
    await car.save();
    console.log(`✅ [createAdvert] Car saved successfully: ${advertId}`);
    
    // Return advert data
    const advert = {
      id: advertId,
      vehicleData: {
        ...vehicleData,
        estimatedValue: estimatedPrice
      },
      advertData: {
        price: estimatedPrice,
        description: '',
        photos: [],
        contactPhone: '',
        contactEmail: '',
        location: ''
      },
      status: 'incomplete',
      createdAt: car.createdAt
    };
    
    res.status(201).json({
      success: true,
      data: advert
    });
    
  } catch (error) {
    console.error('❌ [createAdvert] Error:', error.message);
    console.error('❌ [createAdvert] Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create advert',
      error: error.message,
      errorType: error.name
    });
  }
};

/**
 * Get advert by ID
 */
const getAdvert = async (req, res) => {
    
    // Helper function to parse CO2 emissions (removes "g/km" suffix)
    const parseCO2 = (value) => {
      if (!value) return undefined;
      if (typeof value === 'number') return value;
      // Extract number from strings like "143g/km" or "143 g/km"
      const match = value.toString().match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    };

    // Helper function to normalize transmission
    const normalizeTransmission = (value) => {
      if (!value) return 'manual';
      const lower = value.toString().toLowerCase();
      // Map common variations to valid enum values
      if (lower.includes('auto')) return 'automatic';
      if (lower.includes('manual')) return 'manual';
      if (lower.includes('semi')) return 'semi-automatic';
      return 'manual'; // default
    };

    // Helper function to normalize fuel type
    const normalizeFuelType = (value) => {
      if (!value) return 'Petrol';
      const lower = value.toString().toLowerCase();
      // Map to valid enum values with proper capitalization
      if (lower === 'petrol' || lower === 'gasoline') return 'Petrol';
      if (lower === 'diesel') return 'Diesel';
      if (lower === 'electric' || lower === 'battery electric vehicle') return 'Electric';
      if (lower === 'hybrid' || lower.includes('hybrid')) return 'Hybrid';
      return 'Petrol'; // default
    };

    // Helper to safely parse year
    const parseYear = (year) => {
      if (!year) return new Date().getFullYear();
      const parsed = parseInt(year);
      if (isNaN(parsed) || parsed < 1900 || parsed > new Date().getFullYear() + 1) {
        return new Date().getFullYear();
      }
      return parsed;
    };

    // Helper to safely parse engine size
    const parseEngineSize = (size) => {
      if (!size) return undefined;
      const parsed = parseFloat(size);
      if (isNaN(parsed) || parsed <= 0) return undefined;
      return parsed;
    };

    // Create car document in database immediately
    // If we have a registration number, try to fetch enhanced data from CheckCarDetails API
    // This is optional - if it fails, we'll just use the basic data provided
    let enhancedData = null;
    if (vehicleData.registration || vehicleData.registrationNumber) {
      try {
        const EnhancedVehicleService = require('../services/enhancedVehicleService');
        const registration = vehicleData.registration || vehicleData.registrationNumber;
        const mileage = vehicleData.mileage || 50000;
        console.log(`📡 [AdvertController] Fetching enhanced data for: ${registration}`);
        
        // Set a timeout for the API call (5 seconds max)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 5000)
        );
        
        enhancedData = await Promise.race([
          EnhancedVehicleService.getEnhancedVehicleData(registration, false, mileage),
          timeoutPromise
        ]);
        
        console.log(`✅ [AdvertController] Enhanced data fetched successfully`);
      } catch (error) {
        console.log(`⚠️  [AdvertController] Could not fetch enhanced data (${error.message}) - continuing with basic data`);
        // Continue without enhanced data - this is not critical
        enhancedData = null;
      }
    }
    
    // Filter out invalid variant values
    // Priority: enhancedData.modelVariant > enhancedData.variant > vehicleData.modelVariant > vehicleData.variant
    let variant = null;
    
    // First try enhanced data from API (handle both direct values and {value, source} structure)
    const getEnhancedValue = (field) => {
      if (!field) return null;
      return typeof field === 'object' && field.value !== undefined ? field.value : field;
    };
    
    const enhancedModelVariant = getEnhancedValue(enhancedData?.modelVariant);
    const enhancedVariant = getEnhancedValue(enhancedData?.variant);
    const enhancedEngineSize = getEnhancedValue(enhancedData?.engineSize);
    
    if (enhancedModelVariant && enhancedModelVariant !== 'null' && enhancedModelVariant !== 'undefined' && enhancedModelVariant.trim() !== '') {
      variant = enhancedModelVariant;
      console.log(`✅ [AdvertController] Using ModelVariant from API: "${variant}"`);
    } else if (enhancedVariant && enhancedVariant !== 'null' && enhancedVariant !== 'undefined' && enhancedVariant.trim() !== '') {
      variant = enhancedVariant;
      console.log(`✅ [AdvertController] Using variant from API: "${variant}"`);
    } else if (vehicleData.variant && vehicleData.variant !== 'null' && vehicleData.variant !== 'undefined' && vehicleData.variant.trim() !== '') {
      variant = vehicleData.variant;
    } else if (vehicleData.modelVariant && vehicleData.modelVariant !== 'null' && vehicleData.modelVariant !== 'undefined' && vehicleData.modelVariant.trim() !== '') {
      variant = vehicleData.modelVariant;
    }
    
    // Use enhanced engine size if available (already in litres)
    const engineSize = enhancedEngineSize || parseEngineSize(vehicleData.engineSize);
    
    // Calculate estimated price if not provided
    // For private sellers, prefer PRIVATE price from valuation
    let estimatedPrice = 0;
    
    // First priority: Check if privatePrice is directly provided
    if (vehicleData.privatePrice && vehicleData.privatePrice > 0) {
      estimatedPrice = vehicleData.privatePrice;
      console.log(`💰 Using direct privatePrice: £${estimatedPrice}`);
    }
    // Second priority: Check if we have valuation data from EnhancedVehicleService
    else if (enhancedData?.valuation?.estimatedValue) {
      const valuation = enhancedData.valuation.estimatedValue;
      // Prefer private sale price for private sellers
      estimatedPrice = valuation.private || valuation.retail || valuation.trade || 0;
      console.log(`💰 Using valuation price from EnhancedVehicleService (PRIVATE preferred): £${estimatedPrice}`, {
        private: valuation.private,
        retail: valuation.retail,
        trade: valuation.trade
      });
    }
    // Third priority: Check vehicleData.estimatedValue
    else if (vehicleData.estimatedValue) {
      // Fallback to vehicleData if available
      if (typeof vehicleData.estimatedValue === 'object') {
        // Prefer private sale price for private sellers
        estimatedPrice = vehicleData.estimatedValue.private || 
                        vehicleData.estimatedValue.Private ||
                        vehicleData.estimatedValue.retail || 
                        vehicleData.estimatedValue.trade || 0;
        console.log(`💰 Using valuation price from vehicleData (PRIVATE preferred): £${estimatedPrice}`);
      } else {
        // It's a single number
        estimatedPrice = vehicleData.estimatedValue;
        console.log(`💰 Using single estimatedValue: £${estimatedPrice}`);
      }
    }
    
    if (!estimatedPrice || estimatedPrice === 0) {
      // Calculate based on year, mileage, make
      const currentYear = new Date().getFullYear();
      const vehicleYear = parseYear(vehicleData.year);
      const vehicleAge = currentYear - vehicleYear;
      const mileage = vehicleData.mileage || 0;
      
      // Base value starts at £15000 for new cars
      let baseValue = 15000;
      
      // Depreciate by £1000 per year
      baseValue -= (vehicleAge * 1000);
      
      // Depreciate by £500 per 10,000 miles
      baseValue -= Math.floor(mileage / 10000) * 500;
      
      // Minimum value of £1000
      estimatedPrice = Math.max(baseValue, 1000);
      
      console.log(`💰 Calculated estimated price: £${estimatedPrice} (Year: ${vehicleYear}, Mileage: ${mileage})`);
    }
    
    // Set MOT expiry date (1 year after first registration for new cars, or use provided date)
    let motExpiry = null;
    if (vehicleData.motDue) {
      motExpiry = new Date(vehicleData.motDue);
    } else if (vehicleData.dateFirstRegistered || vehicleData.year) {
      // Set MOT to 1 year after first registration
      const regDate = vehicleData.dateFirstRegistered 
        ? new Date(vehicleData.dateFirstRegistered)
        : new Date(vehicleData.year, 0, 1);
      motExpiry = new Date(regDate);
      motExpiry.setFullYear(motExpiry.getFullYear() + 1);
      console.log(`🔧 Set MOT expiry to: ${motExpiry.toISOString().split('T')[0]}`);
    }
    
    const car = new Car({
      advertId: advertId,
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      variant: variant,
      year: parseYear(vehicleData.year),
      mileage: vehicleData.mileage || 0,
      color: vehicleData.color || 'Not specified',
      fuelType: normalizeFuelType(vehicleData.fuelType),
      transmission: normalizeTransmission(vehicleData.transmission),
      price: estimatedPrice,
      estimatedValue: estimatedPrice,
      // Store all valuation prices if available
      valuation: (vehicleData.privatePrice || vehicleData.tradePrice || vehicleData.retailPrice || enhancedData?.valuation) ? {
        privatePrice: vehicleData.privatePrice || enhancedData?.valuation?.estimatedValue?.private || 0,
        tradePrice: vehicleData.tradePrice || enhancedData?.valuation?.estimatedValue?.trade || 0,
        retailPrice: vehicleData.retailPrice || enhancedData?.valuation?.estimatedValue?.retail || 0,
        confidence: vehicleData.valuationConfidence || enhancedData?.valuation?.confidence || 'medium'
      } : undefined,
      description: '',
      images: [],
      registrationNumber: vehicleData.registration || vehicleData.registrationNumber || null,
      engineSize: engineSize,
      bodyType: vehicleData.bodyType,
      doors: vehicleData.doors ? parseInt(vehicleData.doors) : undefined,
      seats: vehicleData.seats ? parseInt(vehicleData.seats) : undefined,
      co2Emissions: parseCO2(vehicleData.co2Emissions),
      taxStatus: vehicleData.taxDue,
      motStatus: vehicleData.motStatus || 'Unknown',
      motDue: motExpiry,
      motExpiry: motExpiry,
      dataSource: vehicleData.registration ? 'DVLA' : 'manual',
      advertStatus: 'active', // Changed from 'draft' to 'active' - all new cars are active by default
      publishedAt: new Date(), // Set published date immediately
      condition: 'used',
      // Set postcode if provided (for automatic coordinate lookup)
      postcode: vehicleData.postcode || req.body.postcode || undefined,
      // Set seller contact if provided (for automatic userId lookup)
      sellerContact: vehicleData.sellerContact || req.body.sellerContact || {
        email: req.user?.email || req.body.email || undefined,
        phoneNumber: req.body.phoneNumber || undefined,
        allowEmailContact: req.body.allowEmailContact || false
      },
      // Set userId if authenticated (pre-save hook will also try to set from email)
      userId: req.user?._id || req.user?.id || req.userId || undefined,
      // Set dealer fields if this is a trade dealer request
      dealerId: req.dealerId || undefined,
      isDealerListing: !!req.dealerId,
      // Set history check to pending so pre-save hook will fetch it
      historyCheckStatus: vehicleData.registration || vehicleData.registrationNumber ? 'pending' : 'not_required'
    });
    
    await car.save();
    console.log(`✅ Created car advert in database: ${advertId}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
    
    // Return advert data in expected format
    const advert = {
      id: advertId,
      vehicleData: {
        ...vehicleData,
        // Ensure estimatedValue is properly set (prefer private sale price)
        estimatedValue: typeof vehicleData.estimatedValue === 'object' 
          ? (vehicleData.estimatedValue.private || vehicleData.estimatedValue.Private || vehicleData.estimatedValue.retail || vehicleData.estimatedValue.trade)
          : (vehicleData.estimatedValue || calculateEstimatedValue(vehicleData))
      },
      advertData: {
        // Use the same price logic as above
        price: typeof vehicleData.estimatedValue === 'object'
          ? (vehicleData.estimatedValue.private || vehicleData.estimatedValue.Private || vehicleData.estimatedValue.retail || vehicleData.estimatedValue.trade || '')
          : (vehicleData.estimatedValue || ''),
        description: '',
        photos: [],
        contactPhone: '',
        contactEmail: '',
        location: ''
      },
      status: 'incomplete',
      createdAt: car.createdAt
    };
    
    res.status(201).json({
      success: true,
      data: advert
    });
  } catch (error) {
    console.error('❌ [createAdvert] Error creating advert:', error);
    console.error('❌ [createAdvert] Error stack:', error.stack);
    console.error('❌ [createAdvert] Error name:', error.name);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create advert',
      error: error.message,
      errorType: error.name,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

/**
 * Get advert by ID
 */
const getAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    
    // Find car by advertId
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Format response to match expected structure
    // Prefer private sale price from valuation if available
    const privatePrice = car.valuation?.privatePrice || car.price || car.estimatedValue || 0;
    
    const advert = {
      id: car.advertId,
      vehicleData: {
        make: car.make,
        model: car.model,
        variant: car.variant,
        displayTitle: car.displayTitle,
        year: car.year,
        mileage: car.mileage,
        color: car.color,
        fuelType: car.fuelType,
        transmission: car.transmission,
        registrationNumber: car.registrationNumber,
        engineSize: car.engineSize,
        bodyType: car.bodyType,
        doors: car.doors,
        seats: car.seats,
        estimatedValue: privatePrice,
        // Include all valuation prices for reference
        allValuations: car.valuation ? {
          private: car.valuation.privatePrice,
          retail: car.valuation.dealerPrice,
          trade: car.valuation.partExchangePrice
        } : null,
        motDue: car.motDue || car.motExpiry || car.motStatus,
        motStatus: car.motStatus,
        motExpiry: car.motExpiry,
        co2Emissions: car.co2Emissions,
        taxStatus: car.taxStatus,
        fuelEconomyUrban: car.fuelEconomyUrban,
        fuelEconomyExtraUrban: car.fuelEconomyExtraUrban,
        fuelEconomyCombined: car.fuelEconomyCombined,
        annualTax: car.annualTax,
        insuranceGroup: car.insuranceGroup,
        gearbox: car.gearbox,
        emissionClass: car.emissionClass
      },
      advertData: {
        price: privatePrice,
        description: car.description,
        photos: car.images.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          publicId: url.split('/').pop().split('.')[0]
        })),
        contactPhone: car.sellerContact?.phoneNumber || '',
        contactEmail: car.sellerContact?.email || '',
        location: car.sellerContact?.postcode || car.postcode || '',
        features: car.features || [],
        runningCosts: {
          fuelEconomy: {
            urban: car.fuelEconomyUrban || '',
            extraUrban: car.fuelEconomyExtraUrban || '',
            combined: car.fuelEconomyCombined || ''
          },
          annualTax: car.annualTax || '',
          insuranceGroup: car.insuranceGroup || '',
          co2Emissions: car.co2Emissions || ''
        },
        videoUrl: car.videoUrl || ''
      },
      status: car.advertStatus,
      createdAt: car.createdAt
    };
    
    res.json({
      success: true,
      data: advert
    });
  } catch (error) {
    console.error('Error fetching advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advert'
    });
  }
};

/**
 * Update advert (saves photos and other data to database)
 */
const updateAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const { advertData, vehicleData, contactDetails } = req.body;
    
    console.log(`📝 Updating advert data: ${advertId}`);
    
    // Find car by advertId (UUID) or _id (MongoDB ObjectId)
    let car;
    
    // Check if it's a MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
      console.log('🔍 Searching by MongoDB _id');
      car = await Car.findById(advertId);
    } else {
      console.log('🔍 Searching by advertId (UUID)');
      car = await Car.findOne({ advertId });
    }
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    console.log(`✅ Found car: ${car._id} (advertId: ${car.advertId})`);
    
    // Update vehicle data if provided
    if (vehicleData) {
      if (vehicleData.make) car.make = vehicleData.make;
      if (vehicleData.model) car.model = vehicleData.model;
      if (vehicleData.year) car.year = vehicleData.year;
      if (vehicleData.mileage) car.mileage = vehicleData.mileage;
      if (vehicleData.color) car.color = vehicleData.color;
      if (vehicleData.fuelType) car.fuelType = vehicleData.fuelType;
      if (vehicleData.transmission) car.transmission = vehicleData.transmission;
      if (vehicleData.bodyType) car.bodyType = vehicleData.bodyType;
      if (vehicleData.doors) car.doors = vehicleData.doors;
      if (vehicleData.seats) car.seats = vehicleData.seats;
      if (vehicleData.engineSize) car.engineSize = vehicleData.engineSize;
    }
    
    // Update advert data if provided
    if (advertData) {
      if (advertData.price !== undefined) {
        const priceValue = parseFloat(advertData.price);
        if (!isNaN(priceValue)) {
          car.price = priceValue;
          console.log(`💰 Updating price to: £${priceValue}`);
        }
      }
      if (advertData.description !== undefined) car.description = advertData.description;
      
      // Update photos - save Cloudinary URLs to database
      if (advertData.photos && Array.isArray(advertData.photos)) {
        console.log(`📸 Saving ${advertData.photos.length} photos to database`);
        car.images = advertData.photos.map(photo => photo.url || photo);
      }
      
      // Update features
      if (advertData.features && Array.isArray(advertData.features)) {
        car.features = advertData.features;
      }
      
      // Update running costs
      if (advertData.runningCosts) {
        car.runningCosts = {
          fuelEconomy: advertData.runningCosts.fuelEconomy || {},
          annualTax: advertData.runningCosts.annualTax,
          insuranceGroup: advertData.runningCosts.insuranceGroup,
          co2Emissions: advertData.runningCosts.co2Emissions
        };
      }
      
      // Update video URL
      if (advertData.videoUrl !== undefined) {
        car.videoUrl = advertData.videoUrl;
      }
    }
    
    // Update contact details if provided
    if (contactDetails) {
      car.sellerContact = {
        phoneNumber: contactDetails.phoneNumber || car.sellerContact?.phoneNumber,
        email: contactDetails.email || car.sellerContact?.email,
        postcode: contactDetails.postcode || car.sellerContact?.postcode,
        allowEmailContact: contactDetails.allowEmailContact !== undefined 
          ? contactDetails.allowEmailContact 
          : car.sellerContact?.allowEmailContact
      };
      
      // Also update postcode at root level for location searches
      if (contactDetails.postcode) {
        car.postcode = contactDetails.postcode;
      }
    }
    
    // Auto-activate advert if it has all required fields
    const hasImages = car.images && car.images.length > 0;
    const hasContactInfo = car.sellerContact && car.sellerContact.phoneNumber && car.sellerContact.email;
    const hasPrice = car.price && car.price > 0;
    
    if (hasImages && hasContactInfo && hasPrice && car.advertStatus === 'incomplete') {
      car.advertStatus = 'active';
      car.publishedAt = new Date();
      console.log(`✅ Auto-activating advert ${advertId} - all required fields complete`);
    }
    
    await car.save();
    console.log(`✅ Updated advert ${advertId} in database`);
    console.log(`   Price: £${car.price}`);
    console.log(`   Photos saved: ${car.images.length}`);
    console.log(`   Status: ${car.advertStatus}`);
    
    // Return updated advert
    const advert = {
      id: advertId,
      vehicleData: vehicleData || {
        estimatedValue: car.price
      },
      advertData: {
        ...advertData,
        price: car.price, // Return the saved price from database
        photos: car.images.map((url, index) => ({
          id: `photo-${index}`,
          url: url,
          publicId: url.split('/').pop().split('.')[0]
        }))
      },
      contactDetails: contactDetails || {},
      status: car.advertStatus,
      updatedAt: car.updatedAt
    };
    
    res.json({
      success: true,
      data: advert,
      message: 'Advert updated successfully'
    });
  } catch (error) {
    console.error('Error updating advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update advert',
      error: error.message
    });
  }
};

/**
 * Publish advert (after payment)
 */
const publishAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const { packageDetails, stripeSessionId, stripePaymentIntentId } = req.body;
    
    // Find car by advertId
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    // Update advertising package details
    if (packageDetails) {
      car.advertisingPackage = {
        packageId: packageDetails.packageId,
        packageName: packageDetails.packageName,
        duration: packageDetails.duration,
        price: packageDetails.price,
        purchaseDate: new Date(),
        expiryDate: calculateExpiryDate(packageDetails.duration),
        stripeSessionId: stripeSessionId,
        stripePaymentIntentId: stripePaymentIntentId
      };
    }
    
    // Update status to active
    car.advertStatus = 'active';
    car.publishedAt = new Date();
    
    await car.save();
    
    res.json({
      success: true,
      data: {
        id: car.advertId,
        status: car.advertStatus,
        publishedAt: car.publishedAt
      },
      message: 'Advert published successfully'
    });
  } catch (error) {
    console.error('Error publishing advert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish advert'
    });
  }
};

/**
 * Calculate expiry date based on package duration
 */
const calculateExpiryDate = (duration) => {
  const now = new Date();
  
  if (duration.includes('Until sold')) {
    // Set expiry to 1 year from now for "until sold" packages
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  
  // Extract weeks from duration string (e.g., "3 weeks" -> 3)
  const weeks = parseInt(duration.match(/\d+/)?.[0] || 4);
  return new Date(now.setDate(now.getDate() + (weeks * 7)));
};

/**
 * Calculate estimated value based on vehicle data
 */
const calculateEstimatedValue = (vehicleData) => {
  // Simple estimation logic (replace with actual valuation API)
  const baseValue = 15000;
  const yearFactor = vehicleData.year ? (2024 - parseInt(vehicleData.year)) * 500 : 0;
  const mileageFactor = vehicleData.mileage ? Math.floor(parseInt(vehicleData.mileage) / 10000) * 300 : 0;
  
  return Math.max(baseValue - yearFactor - mileageFactor, 2000);
};

module.exports = {
  createAdvert,
  getAdvert,
  updateAdvert,
  publishAdvert
};
