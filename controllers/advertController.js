const { v4: uuidv4 } = require('uuid');
const Car = require('../models/Car');
const CarDataNormalizer = require('../utils/carDataNormalizer'); // Add this import
const DataProtection = require('../utils/dataProtection'); // Add data protection
const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const AutoDataPopulationService = require('../services/autoDataPopulationService');
const { normalizeMake } = require('../utils/makeNormalizer');

/**
 * Create a new advert - SIMPLIFIED VERSION
 */
const createAdvert = async (req, res) => {
  try {
    
    const { vehicleData } = req.body;
    
    if (!vehicleData) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle data is required'
      });
    }
    
    const advertId = uuidv4();

    // CRITICAL: Check for existing car with same registration
    const registration = vehicleData.registration || vehicleData.registrationNumber;
    if (registration) {
      const cleanReg = registration.toUpperCase().replace(/\s/g, '');
      const existing = await Car.findOne({ registrationNumber: cleanReg });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            id: existing.advertId,
            vehicleData: { ...vehicleData, estimatedValue: existing.price },
            advertData: { price: existing.price, description: existing.description || '', photos: existing.images || [] },
            status: existing.advertStatus,
            createdAt: existing.createdAt
          }
        });
      }
    }
    
    // Calculate price with fallback
    let estimatedPrice = 10000;
    
    if (vehicleData.privatePrice) {
      estimatedPrice = vehicleData.privatePrice;
    } else if (vehicleData.estimatedValue) {
      if (typeof vehicleData.estimatedValue === 'object') {
        estimatedPrice = vehicleData.estimatedValue.private || 
                        vehicleData.estimatedValue.retail || 
                        vehicleData.estimatedValue.trade || 10000;
      } else {
        estimatedPrice = vehicleData.estimatedValue;
      }
    }
    
    // Normalize transmission value to match enum
    let normalizedTransmission = vehicleData.transmission || 'manual';
    if (normalizedTransmission) {
      const trans = normalizedTransmission.toLowerCase().trim();
      // Map common variations to valid enum values
      if (trans.includes('cvt') || trans.includes('automatic') || trans === 'auto') {
        normalizedTransmission = 'automatic';
      } else if (trans.includes('semi') || trans.includes('dsg') || trans.includes('tiptronic')) {
        normalizedTransmission = 'semi-automatic';
      } else if (trans.includes('manual')) {
        normalizedTransmission = 'manual';
      } else {
        normalizedTransmission = 'manual'; // default
      }
    }
    
    // CRITICAL: Normalize fuel type (e.g., "Diesel/Electric" → "Diesel Plug-in Hybrid")
    let normalizedFuelType = vehicleData.fuelType || 'Petrol';
    if (normalizedFuelType) {
      const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
      const universalService = new UniversalAutoCompleteService();
      normalizedFuelType = universalService.normalizeFuelType(normalizedFuelType, null);
      
      if (normalizedFuelType !== vehicleData.fuelType) {
      }
    }
    
    // Normalize vehicle data before creating car
    const normalizedVehicleData = CarDataNormalizer.normalizeCarData(vehicleData);
    
    // CRITICAL: Enhance electric vehicle data BEFORE creating car
    let carDataToSave = normalizedVehicleData;
    if (normalizedVehicleData.fuelType === 'Electric') {
      
      // Enhance with comprehensive electric vehicle data
      carDataToSave = ElectricVehicleEnhancementService.enhanceWithEVData(normalizedVehicleData);
      
      // Also use auto data population for additional defaults
      carDataToSave = AutoDataPopulationService.populateMissingData(carDataToSave);
      
    }
    
    // Create car with enhanced variant handling
    const car = new Car({
      advertId,
      userId: req.user ? (req.user._id || req.user.id) : null, // CRITICAL: Set userId for My Listings
      make: normalizeMake(carDataToSave.make) || 'Unknown',
      model: carDataToSave.model || 'Unknown',
      variant: carDataToSave.variant || null, // Will be auto-fetched in pre-save hook if missing
      year: parseInt(carDataToSave.year) || new Date().getFullYear(),
      mileage: parseInt(carDataToSave.mileage) || 0,
      color: carDataToSave.color || null, // Leave null so API can populate it, frontend will handle display
      fuelType: normalizedFuelType,
      transmission: normalizedTransmission,
      price: estimatedPrice,
      estimatedValue: estimatedPrice,
      description: '',
      images: [],
      registrationNumber: carDataToSave.registration || carDataToSave.registrationNumber || null,
      engineSize: parseFloat(carDataToSave.engineSize) || undefined,
      bodyType: carDataToSave.bodyType || undefined,
      doors: parseInt(carDataToSave.doors) || undefined,
      seats: parseInt(carDataToSave.seats) || undefined,
      dataSource: carDataToSave.registration ? 'DVLA' : 'manual',
      advertStatus: 'pending_payment',
      condition: 'used',
      postcode: carDataToSave.postcode || undefined,
      // Electric vehicle fields (if applicable)
      electricRange: carDataToSave.electricRange || undefined,
      batteryCapacity: carDataToSave.batteryCapacity || undefined,
      chargingTime: carDataToSave.chargingTime || undefined,
      homeChargingSpeed: carDataToSave.homeChargingSpeed || undefined,
      publicChargingSpeed: carDataToSave.publicChargingSpeed || undefined,
      rapidChargingSpeed: carDataToSave.rapidChargingSpeed || undefined,
      chargingTime10to80: carDataToSave.chargingTime10to80 || undefined,
      electricMotorPower: carDataToSave.electricMotorPower || undefined,
      electricMotorTorque: carDataToSave.electricMotorTorque || undefined,
      chargingPortType: carDataToSave.chargingPortType || undefined,
      fastChargingCapability: carDataToSave.fastChargingCapability || undefined,
      runningCosts: carDataToSave.runningCosts || undefined
    });
    
    
    // CRITICAL: Normalize model/variant BEFORE saving
    // This ensures proper organization in filter sidebar
    const makeUpper = car.make ? car.make.toUpperCase() : '';
    const modelStr = car.model ? car.model.trim() : '';
    const variantStr = car.variant ? car.variant.trim() : '';
    
    // Volkswagen: Golf GTE → Golf, Polo Match → Polo
    if (makeUpper === 'VOLKSWAGEN') {
      if (modelStr.startsWith('Golf ') && modelStr !== 'Golf') {
        const variantPart = modelStr.replace('Golf ', '').trim();
        car.model = 'Golf';
        car.variant = variantPart || variantStr;
      } else if (modelStr.startsWith('Polo ') && modelStr !== 'Polo') {
        const variantPart = modelStr.replace('Polo ', '').trim();
        car.model = 'Polo';
        car.variant = variantPart || variantStr;
      }
    }
    
    // Audi: A3 Black 35 TFSI → A3
    if (makeUpper === 'AUDI') {
      const audiModelPattern = /^(A[1-8]|Q[2-8]|TT|R8)\s+(.+)$/i;
      const match = modelStr.match(audiModelPattern);
      if (match) {
        const baseModel = match[1];
        const variantPart = match[2];
        car.model = baseModel;
        car.variant = variantPart || variantStr;
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
          car.model = baseModel;
          if (!variantStr || variantStr === modelStr) {
            car.variant = modelStr;
          }
        }
      }
    }
    
    // Body Type Capitalization: HATCHBACK → Hatchback
    if (car.bodyType) {
      const normalized = car.bodyType.charAt(0).toUpperCase() + car.bodyType.slice(1).toLowerCase();
      if (car.bodyType !== normalized) {
        car.bodyType = normalized;
      }
    }
    
    // CRITICAL: Sync MOT data from VehicleHistory BEFORE saving (single save)
    if (car.registrationNumber) {
      try {
        const VehicleHistory = require('../models/VehicleHistory');
        const history = await VehicleHistory.findOne({ 
          vrm: car.registrationNumber.toUpperCase() 
        }).sort({ checkDate: -1 });
        
        if (history && history.motHistory && history.motHistory.length > 0) {
          
          // Normalize MOT history
          const normalizedMotHistory = history.motHistory.map(test => ({
            testDate: test.testDate || test.completedDate || test.date,
            expiryDate: test.expiryDate,
            testResult: test.testResult || test.result || 'PASSED',
            odometerValue: test.odometerValue || test.mileage,
            odometerUnit: (test.odometerUnit || 'MI').toLowerCase(),
            testNumber: test.testNumber,
            testCertificateNumber: test.testCertificateNumber,
            defects: test.defects || [],
            advisoryText: test.advisoryText || [],
            testClass: test.testClass,
            testType: test.testType,
            completedDate: test.completedDate || test.testDate,
            testStation: test.testStation
          })).filter(test => test.testDate);
          
          car.motHistory = normalizedMotHistory;
          
          if (history.motStatus) {
            car.motStatus = history.motStatus;
          }
          
          if (history.motExpiryDate) {
            car.motDue = history.motExpiryDate;
            car.motExpiry = history.motExpiryDate;
          }
          
        } else {
        }
      } catch (syncError) {
        console.error(`❌ Failed to sync MOT data:`, syncError.message);
        // Don't fail the request - continue without MOT data
      }
    }
    
    // SINGLE SAVE - with all data (variant + MOT)
    // Skip DVLA API in pre-save hook (data already fetched by vehicleController)
    car.$locals.skipPreSave = true;
    await car.save();
    
    
    res.status(201).json({
      success: true,
      data: {
        id: advertId,
        vehicleData: { 
          ...vehicleData, 
          estimatedValue: estimatedPrice,
          // CRITICAL: Include valuation structure for frontend
          valuation: car.valuation ? {
            privatePrice: car.valuation.privatePrice,
            dealerPrice: car.valuation.dealerPrice,
            partExchangePrice: car.valuation.partExchangePrice
          } : null,
          allValuations: car.valuation ? {
            private: car.valuation.privatePrice,
            retail: car.valuation.dealerPrice,
            trade: car.valuation.partExchangePrice
          } : null,
          // CRITICAL: Include MOT data for frontend
          motDue: car.motDue,
          motExpiry: car.motExpiry,
          motStatus: car.motStatus,
          motHistory: car.motHistory
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
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create advert',
      error: error.message
    });
  }
};

/**
 * Get advert by ID
 */
const getAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
    const privatePrice = car.valuation?.privatePrice || car.price || car.estimatedValue || 0;
    
    res.json({
      success: true,
      data: {
        id: car.advertId,
        vehicleData: {
          make: car.make,
          model: car.model,
          variant: car.variant,
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
          // CRITICAL: Include MOT data for frontend display
          motDue: car.motDue,
          motExpiry: car.motExpiry,
          motStatus: car.motStatus,
          motHistory: car.motHistory,
          // CRITICAL: Include valuation structure for frontend
          valuation: car.valuation ? {
            privatePrice: car.valuation.privatePrice,
            dealerPrice: car.valuation.dealerPrice,
            partExchangePrice: car.valuation.partExchangePrice
          } : null,
          allValuations: car.valuation ? {
            private: car.valuation.privatePrice,
            retail: car.valuation.dealerPrice,
            trade: car.valuation.partExchangePrice
          } : null,
          // CRITICAL: Include running costs for frontend display
          runningCosts: {
            fuelEconomy: {
              urban: car.fuelEconomyUrban || car.runningCosts?.fuelEconomy?.urban || null,
              extraUrban: car.fuelEconomyExtraUrban || car.runningCosts?.fuelEconomy?.extraUrban || null,
              combined: car.fuelEconomyCombined || car.runningCosts?.fuelEconomy?.combined || null
            },
            annualTax: car.annualTax || car.runningCosts?.annualTax || null,
            co2Emissions: car.co2Emissions || car.runningCosts?.co2Emissions || null,
            insuranceGroup: car.insuranceGroup || car.runningCosts?.insuranceGroup || null
          },
          // Also include top-level fields for backward compatibility
          annualTax: car.annualTax,
          co2Emissions: car.co2Emissions,
          insuranceGroup: car.insuranceGroup,
          fuelEconomyCombined: car.fuelEconomyCombined,
          fuelEconomyUrban: car.fuelEconomyUrban,
          fuelEconomyExtraUrban: car.fuelEconomyExtraUrban
        },
        advertData: {
          price: privatePrice,
          description: car.description,
          photos: car.images.map((url, index) => ({
            id: `photo-${index}`,
            url: url
          })),
          contactPhone: car.sellerContact?.phoneNumber || '',
          contactEmail: car.sellerContact?.email || '',
          location: car.postcode || ''
        },
        status: car.advertStatus,
        createdAt: car.createdAt
      }
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
 * Update advert
 */
const updateAdvert = async (req, res) => {
  try {
    
    const { advertId } = req.params;
    const { advertData, vehicleData, contactDetails } = req.body;
    
    // Use findOneAndUpdate with retry logic to handle version conflicts
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Refresh car document for each attempt to get latest version
        let car;
        if (/^[0-9a-fA-F]{24}$/.test(advertId)) {
          car = await Car.findById(advertId);
        } else {
          car = await Car.findOne({ advertId });
        }
        
        if (!car) {
          return res.status(404).json({
            success: false,
            message: 'Advert not found'
          });
        }
        
        
        // Build update object instead of modifying the document directly
        const updateObj = {};
        
        // Update vehicle data (exclude version field to avoid conflicts)
        if (vehicleData) {
          const { __v, _id, createdAt, updatedAt, ...cleanVehicleData } = vehicleData;
          
          // CRITICAL FIX: Handle estimatedValue conversion from object to number
          if (cleanVehicleData.estimatedValue && typeof cleanVehicleData.estimatedValue === 'object') {
            // If estimatedValue is an object, extract the private price
            if (cleanVehicleData.estimatedValue.private) {
              cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.private;
            } else if (cleanVehicleData.estimatedValue.retail) {
              cleanVehicleData.estimatedValue = cleanVehicleData.estimatedValue.retail;
            } else {
              // If object is empty or has no valid prices, remove it
              delete cleanVehicleData.estimatedValue;
            }
          }
          
          // CRITICAL FIX: Handle allValuations - this should not be saved to Car model
          if (cleanVehicleData.allValuations) {
            delete cleanVehicleData.allValuations;
          }
          
          // Handle MOT date updates
          if (cleanVehicleData.motDue) {
            updateObj.motDue = new Date(cleanVehicleData.motDue);
            updateObj.motExpiry = new Date(cleanVehicleData.motDue);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'motDue');
            DataProtection.markAsUserEdited(car, 'motExpiry');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('motDue')) updateObj.userEditedFields.push('motDue');
            if (!updateObj.userEditedFields.includes('motExpiry')) updateObj.userEditedFields.push('motExpiry');
          }
          
          // Handle seats updates
          if (cleanVehicleData.seats) {
            updateObj.seats = parseInt(cleanVehicleData.seats);
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'seats');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('seats')) updateObj.userEditedFields.push('seats');
          }
          
          // Handle model updates
          if (cleanVehicleData.model) {
            updateObj.model = cleanVehicleData.model.trim();
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'model');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('model')) updateObj.userEditedFields.push('model');
          }
          
          // Handle variant updates
          if (cleanVehicleData.hasOwnProperty('variant')) {
            updateObj.variant = cleanVehicleData.variant ? cleanVehicleData.variant.trim() : '';
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'variant');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('variant')) updateObj.userEditedFields.push('variant');
          }
          
          // Handle service history updates
          if (cleanVehicleData.serviceHistory) {
            updateObj.serviceHistory = cleanVehicleData.serviceHistory;
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'serviceHistory');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('serviceHistory')) updateObj.userEditedFields.push('serviceHistory');
          }
          
          // Handle fuel type updates - CRITICAL: Normalize fuel type
          if (cleanVehicleData.fuelType) {
            // Import Universal Service for fuel type normalization
            const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
            const universalService = new UniversalAutoCompleteService();
            
            // Normalize fuel type (e.g., "Diesel/Electric" → "Diesel Hybrid")
            const normalizedFuelType = universalService.normalizeFuelType(cleanVehicleData.fuelType, null);
            updateObj.fuelType = normalizedFuelType;
            
            if (normalizedFuelType !== cleanVehicleData.fuelType) {
            } else {
            }
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'fuelType');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('fuelType')) updateObj.userEditedFields.push('fuelType');
          }
          
          // Handle color updates
          if (cleanVehicleData.color) {
            updateObj.color = cleanVehicleData.color;
            
            // Mark as user-edited
            DataProtection.markAsUserEdited(car, 'color');
            if (!updateObj.userEditedFields) updateObj.userEditedFields = car.userEditedFields || [];
            if (!updateObj.userEditedFields.includes('color')) updateObj.userEditedFields.push('color');
          }
          
          // CRITICAL FIX: Don't let Object.assign overwrite sellerContact completely
          // Extract sellerContact from cleanVehicleData before Object.assign
          const vehicleDataSellerContact = cleanVehicleData.sellerContact;
          delete cleanVehicleData.sellerContact;
          
          Object.assign(updateObj, cleanVehicleData);
          
          // CRITICAL FIX: Merge sellerContact carefully to preserve business info
          if (vehicleDataSellerContact) {
            if (!updateObj.sellerContact) {
              updateObj.sellerContact = {};
            }
            // Only copy non-business fields from vehicleData
            if (vehicleDataSellerContact.type) updateObj.sellerContact.type = vehicleDataSellerContact.type;
            if (vehicleDataSellerContact.phoneNumber) updateObj.sellerContact.phoneNumber = vehicleDataSellerContact.phoneNumber;
            if (vehicleDataSellerContact.email) updateObj.sellerContact.email = vehicleDataSellerContact.email;
            if (vehicleDataSellerContact.postcode) updateObj.sellerContact.postcode = vehicleDataSellerContact.postcode;
            if (vehicleDataSellerContact.allowEmailContact !== undefined) updateObj.sellerContact.allowEmailContact = vehicleDataSellerContact.allowEmailContact;
            if (vehicleDataSellerContact.stats) updateObj.sellerContact.stats = vehicleDataSellerContact.stats;
            if (vehicleDataSellerContact.reviewCount !== undefined) updateObj.sellerContact.reviewCount = vehicleDataSellerContact.reviewCount;
            
          }
        }
        
        // Update advert data
        if (advertData) {
          
          if (advertData.price) {
            const priceValue = parseFloat(advertData.price);
            if (!isNaN(priceValue) && priceValue > 0) {
              updateObj.price = priceValue;
            } else {
            }
          }
          if (advertData.hasOwnProperty('description')) {
            // CRITICAL FIX: Handle description based on dataSource
            let description = advertData.description || '';
            
            // NEVER allow empty description - always use existing or default
            if (!description.trim()) {
              // Use existing description if available
              if (car.description && car.description.trim()) {
                description = car.description;
              } else {
                // Check if description is required (non-DVLA cars require description)
                const isDescriptionRequired = car.dataSource !== 'DVLA';
                
                if (isDescriptionRequired) {
                  // For non-DVLA cars, description is required - use default
                  description = 'No description provided.';
                } else {
                  // For DVLA cars, description is optional - but Mongoose validation might fail with empty string
                  // So we use a minimal description instead
                  description = 'Contact seller for more details.';
                }
              }
            }
            
            updateObj.description = description;
          }
          if (advertData.photos) updateObj.images = advertData.photos.map(p => p.url || p);
          if (advertData.features) {
            updateObj.features = advertData.features;
          }
          if (advertData.hasOwnProperty('videoUrl')) {
            updateObj.videoUrl = advertData.videoUrl || '';
          }
          if (advertData.hasOwnProperty('serviceHistory')) {
            updateObj.serviceHistory = advertData.serviceHistory;
          }
          
          // CRITICAL: Save business info even when contactDetails is not provided
          if (advertData.businessName || advertData.businessLogo || advertData.businessWebsite) {
            
            const hasLogo = advertData?.businessLogo && advertData.businessLogo.trim() !== '';
            const hasWebsite = advertData?.businessWebsite && advertData.businessWebsite.trim() !== '';
            const detectedSellerType = (hasLogo || hasWebsite) ? 'trade' : 'private';
            
            
            // Update or create sellerContact using dot notation for proper MongoDB update
            if (!updateObj.sellerContact) updateObj.sellerContact = {};
            updateObj.sellerContact.type = detectedSellerType;
            if (advertData.businessName) {
              updateObj.sellerContact.businessName = advertData.businessName;
            }
            if (advertData.businessLogo) {
              updateObj.sellerContact.businessLogo = advertData.businessLogo;
            }
            if (advertData.businessWebsite) {
              updateObj.sellerContact.businessWebsite = advertData.businessWebsite;
            }
            
          }
        }
        
        // Update contact details
        if (contactDetails) {
          
          // Auto-detect seller type based on business info
          const hasLogo = advertData?.businessLogo && advertData.businessLogo.trim() !== '';
          const hasWebsite = advertData?.businessWebsite && advertData.businessWebsite.trim() !== '';
          const detectedSellerType = (hasLogo || hasWebsite) ? 'trade' : 'private';
          
          
          // Build sellerContact object preserving existing fields
          if (!updateObj.sellerContact) updateObj.sellerContact = {};
          updateObj.sellerContact.type = detectedSellerType;
          updateObj.sellerContact.phoneNumber = contactDetails.phoneNumber;
          updateObj.sellerContact.email = contactDetails.email;
          updateObj.sellerContact.postcode = contactDetails.postcode;
          updateObj.sellerContact.allowEmailContact = contactDetails.allowEmailContact;
          
          // Add business info if provided
          if (advertData?.businessName) {
            updateObj.sellerContact.businessName = advertData.businessName;
          }
          if (advertData?.businessLogo) {
            updateObj.sellerContact.businessLogo = advertData.businessLogo;
          }
          if (advertData?.businessWebsite) {
            updateObj.sellerContact.businessWebsite = advertData.businessWebsite;
          }
          
          if (contactDetails.postcode) updateObj.postcode = contactDetails.postcode;
        }
        
        // Auto-activate if complete
        const hasImages = (updateObj.images || car.images) && (updateObj.images || car.images).length > 0;
        const hasContact = (updateObj.sellerContact || car.sellerContact)?.phoneNumber && 
                          (updateObj.sellerContact || car.sellerContact)?.email;
        const hasPrice = (updateObj.price || car.price) > 0;
        
        if (hasImages && hasContact && hasPrice && car.advertStatus === 'incomplete') {
          updateObj.advertStatus = 'active';
          updateObj.publishedAt = new Date();
        }
        
        
        // Remove any MongoDB internal fields that might cause conflicts
        const mongoInternalFields = ['__v', '_id', 'createdAt', 'updatedAt'];
        mongoInternalFields.forEach(field => {
          if (updateObj.hasOwnProperty(field)) {
            delete updateObj[field];
          }
        });
        
        
        // CRITICAL FIX: Convert nested sellerContact object to dot notation for MongoDB $set
        // This preserves existing fields instead of replacing the entire object
        const setUpdate = { ...updateObj };
        if (updateObj.sellerContact) {
          const sellerContact = updateObj.sellerContact;
          delete setUpdate.sellerContact;
          
          // Add each sellerContact field with dot notation
          Object.keys(sellerContact).forEach(key => {
            setUpdate[`sellerContact.${key}`] = sellerContact[key];
          });
          
        }
        
        // Use findOneAndUpdate with the current version to handle concurrency
        const updatedCar = await Car.findOneAndUpdate(
          { 
            _id: car._id,
            __v: car.__v  // Include version in query to handle optimistic concurrency
          },
          { 
            $set: setUpdate,
            $inc: { __v: 1 }  // Increment version
          },
          { 
            new: true,  // Return updated document
            runValidators: false,  // Disable validators for dot notation updates
            context: 'query'  // Set validation context to 'query' for proper 'this' binding
          }
        );
        
        
        if (!updatedCar) {
          // Document was modified by another process, retry
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        // CRITICAL: Also update VehicleHistory if it exists and we're updating service history, MOT, or seats
        if (car.historyCheckId && (updateObj.serviceHistory || updateObj.motDue || updateObj.seats || updateObj.fuelType)) {
          try {
            const VehicleHistory = require('../models/VehicleHistory');
            const historyUpdate = {};
            
            if (updateObj.serviceHistory) {
              historyUpdate.serviceHistory = updateObj.serviceHistory;
            }
            
            if (updateObj.motDue) {
              historyUpdate.motExpiryDate = updateObj.motDue;
            }
            
            if (updateObj.seats) {
              historyUpdate.seats = updateObj.seats;
            }
            
            if (updateObj.fuelType) {
              historyUpdate.fuelType = updateObj.fuelType;
            }
            
            await VehicleHistory.findByIdAndUpdate(
              car.historyCheckId,
              { $set: historyUpdate },
              { runValidators: true }
            );
            
          } catch (historyError) {
            console.error('⚠️ [updateAdvert] Failed to update VehicleHistory:', historyError.message);
            // Don't fail the whole operation if VehicleHistory update fails
          }
        }
        
        
        return res.json({
          success: true,
          data: {
            id: advertId,
            status: updatedCar.advertStatus
          },
          message: 'Advert updated successfully'
        });
        
      } catch (error) {
        console.error(`❌ [updateAdvert] Error on attempt ${attempt + 1}:`, error.message);
        
        if (error.name === 'VersionError' && attempt < maxRetries - 1) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        if (error.name === 'MongoServerError' && error.code === 11000 && attempt < maxRetries - 1) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        if (error.message && error.message.includes('version') && attempt < maxRetries - 1) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
          continue;
        }
        
        throw error; // Re-throw if not a retryable error or max retries reached
      }
    }
    
    // If we get here, all retries failed
    throw new Error('Failed to update after multiple attempts due to concurrent modifications');
    
  } catch (error) {
    console.error('❌ [updateAdvert] Error updating advert:', error);
    console.error('❌ [updateAdvert] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update advert',
      error: error.message
    });
  }
};

/**
 * Publish advert
 */
const publishAdvert = async (req, res) => {
  try {
    const { advertId } = req.params;
    const car = await Car.findOne({ advertId });
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Advert not found'
      });
    }
    
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
 * Delete an advert with automatic cleanup of Vehicle History
 */
const deleteAdvert = async (req, res) => {
  try {
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Car ID is required'
      });
    }
    
    
    // Use the safe delete method from Car model
    const result = await Car.deleteCarWithCleanup(id);
    
    if (result.success) {
      
      return res.status(200).json({
        success: true,
        message: 'Car and associated data deleted successfully',
        data: {
          deletedCarId: id,
          deletedCar: result.deletedCar
        }
      });
    } else {
      console.error('❌ [deleteAdvert] Delete failed:', result.error);
      
      return res.status(404).json({
        success: false,
        message: result.error || 'Car not found'
      });
    }
    
  } catch (error) {
    console.error('❌ [deleteAdvert] Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete advert'
    });
  }
};

module.exports = {
  createAdvert,
  getAdvert,
  updateAdvert,
  publishAdvert,
  deleteAdvert
};
