const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const dvlaService = require('../services/dvlaService');
const HistoryService = require('../services/historyService');
const Car = require('../models/Car');
const { createErrorFromCode, logError } = require('../utils/dvlaErrorHandler');
const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const AutoDataPopulationService = require('../services/autoDataPopulationService');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');
const { normalizeMake } = require('../utils/makeNormalizer');

// Initialize services
const historyService = new HistoryService();
const universalService = new UniversalAutoCompleteService();

class VehicleController {
  /**
   * Clean up "null" string values in vehicle data
   * @param {Object} carData - Vehicle data object
   * @returns {Object} Cleaned vehicle data
   */
  cleanNullStrings(carData) {
    // Clean variant field
    if (carData.variant === 'null' || carData.variant === 'undefined' || carData.variant === '') {
      carData.variant = null;
    }
    // Clean submodel field
    if (carData.submodel === 'null' || carData.submodel === 'undefined' || carData.submodel === '') {
      carData.submodel = null;
    }
    return carData;
  }

  /**
   * Validation rules for vehicle lookup
   */
  static lookupValidationRules() {
    return [
      body('registrationNumber')
        .trim()
        .notEmpty()
        .withMessage('Registration number is required')
        .isLength({ min: 2, max: 10 })
        .withMessage('Registration number must be between 2 and 10 characters'),
      body('mileage')
        .isInt({ min: 0 })
        .withMessage('Mileage must be a positive number'),
      body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
      body('postcode')
        .optional()
        .trim()
        .isLength({ min: 5, max: 10 })
        .withMessage('Invalid postcode format'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters')
    ];
  }

  /**
   * Validation rules for registration validation
   */
  static validateRegistrationRules() {
    return [
      body('registrationNumber')
        .trim()
        .notEmpty()
        .withMessage('Registration number is required')
    ];
  }

  /**
   * POST /api/vehicles/lookup
   * Lookup vehicle from DVLA and create Car record
   */
  async lookupAndCreateVehicle(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber, mileage, price, postcode, description, transmission, purchaseId } = req.body;

      // IMPORTANT: Require payment verification before creating vehicle record
      if (!purchaseId) {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'Payment is required before adding a vehicle listing',
            details: 'Please complete payment first'
          }
        });
      }

      // Verify the purchase exists and is paid
      const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
      const purchase = await AdvertisingPackagePurchase.findById(purchaseId);
      
      if (!purchase) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PURCHASE_NOT_FOUND',
            message: 'Purchase record not found',
            details: 'Invalid purchase ID'
          }
        });
      }

      if (purchase.status !== 'paid') {
        return res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_COMPLETED',
            message: 'Payment has not been completed',
            details: 'Please complete payment before adding your vehicle'
          }
        });
      }

      // Check if this purchase has already been used
      if (purchase.vehicleId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PURCHASE_ALREADY_USED',
            message: 'This purchase has already been used for another vehicle',
            details: 'Each purchase can only be used once'
          }
        });
      }

      // Step 1: Lookup vehicle from DVLA
      console.log(`[Vehicle Controller] Looking up vehicle: ${registrationNumber}`);
      
      let dvlaData;
      try {
        dvlaData = await dvlaService.lookupVehicle(registrationNumber);
      } catch (error) {
        console.error(`[Vehicle Controller] DVLA lookup failed:`, error.message);
        
        // Return appropriate error
        let statusCode = 500;
        let errorMessage = 'Failed to lookup vehicle from DVLA';
        
        if (error.message === 'VEHICLE_NOT_FOUND') {
          statusCode = 404;
          errorMessage = 'Vehicle not found in DVLA database';
        } else if (error.message === 'INVALID_REGISTRATION') {
          statusCode = 400;
          errorMessage = 'Invalid registration number format';
        } else if (error.message === 'AUTH_ERROR') {
          statusCode = 401;
          errorMessage = 'DVLA API authentication failed';
        } else if (error.message === 'RATE_LIMIT') {
          statusCode = 429;
          errorMessage = 'DVLA API rate limit exceeded';
        } else if (error.message === 'NETWORK_ERROR') {
          statusCode = 503;
          errorMessage = 'Unable to connect to DVLA API';
        }
        
        return res.status(statusCode).json({
          success: false,
          error: {
            code: error.message,
            message: errorMessage
          }
        });
      }

      // Step 2: Map DVLA data to Car schema (as fallback/basic data)
      const carData = dvlaService.mapDVLADataToCarSchema(dvlaData, mileage, {
        price,
        postcode,
        description,
        transmission
      });
      
      // CRITICAL: Use Universal Auto Complete Service instead of direct API calls
      // Universal Service handles all vehicle data fetching with proper caching and race condition prevention
      console.log(`[Vehicle Controller] Using Universal Auto Complete Service for complete data...`);
      
      // Create a temporary vehicle object for the Universal Service
      const tempVehicle = new Car(carData);
      
      try {
        // Use Universal Service to get complete vehicle data
        const completeVehicle = await universalService.completeCarData(tempVehicle, false);
        
        // Override carData with complete data from Universal Service - FIXED: Use proper null checking
        if (completeVehicle.make !== null && completeVehicle.make !== undefined) carData.make = completeVehicle.make;
        if (completeVehicle.model !== null && completeVehicle.model !== undefined) carData.model = completeVehicle.model;
        if (completeVehicle.variant !== null && completeVehicle.variant !== undefined) carData.variant = completeVehicle.variant;
        if (completeVehicle.bodyType !== null && completeVehicle.bodyType !== undefined) carData.bodyType = completeVehicle.bodyType;
        if (completeVehicle.doors !== null && completeVehicle.doors !== undefined) carData.doors = completeVehicle.doors;
        if (completeVehicle.seats !== null && completeVehicle.seats !== undefined) carData.seats = completeVehicle.seats;
        if (completeVehicle.transmission !== null && completeVehicle.transmission !== undefined) carData.transmission = completeVehicle.transmission;
        if (completeVehicle.engineSize !== null && completeVehicle.engineSize !== undefined) carData.engineSize = completeVehicle.engineSize;
        if (completeVehicle.emissionClass !== null && completeVehicle.emissionClass !== undefined) carData.emissionClass = completeVehicle.emissionClass;
        if (completeVehicle.urbanMpg !== null && completeVehicle.urbanMpg !== undefined) carData.fuelEconomyUrban = completeVehicle.urbanMpg;
        if (completeVehicle.extraUrbanMpg !== null && completeVehicle.extraUrbanMpg !== undefined) carData.fuelEconomyExtraUrban = completeVehicle.extraUrbanMpg;
        if (completeVehicle.combinedMpg !== null && completeVehicle.combinedMpg !== undefined) carData.fuelEconomyCombined = completeVehicle.combinedMpg;
        if (completeVehicle.co2Emissions !== null && completeVehicle.co2Emissions !== undefined) carData.co2Emissions = completeVehicle.co2Emissions;
        if (completeVehicle.annualTax !== null && completeVehicle.annualTax !== undefined) carData.annualTax = completeVehicle.annualTax;
        if (completeVehicle.insuranceGroup !== null && completeVehicle.insuranceGroup !== undefined) carData.insuranceGroup = completeVehicle.insuranceGroup;
        if (completeVehicle.color !== null && completeVehicle.color !== undefined) carData.color = completeVehicle.color;
        if (completeVehicle.estimatedValue !== null && completeVehicle.estimatedValue !== undefined) carData.estimatedValue = completeVehicle.estimatedValue;
        if (completeVehicle.privatePrice !== null && completeVehicle.privatePrice !== undefined) carData.privatePrice = completeVehicle.privatePrice;
        if (completeVehicle.dealerPrice !== null && completeVehicle.dealerPrice !== undefined) carData.dealerPrice = completeVehicle.dealerPrice;
        if (completeVehicle.partExchangePrice !== null && completeVehicle.partExchangePrice !== undefined) carData.partExchangePrice = completeVehicle.partExchangePrice;
        if (completeVehicle.motStatus !== null && completeVehicle.motStatus !== undefined) carData.motStatus = completeVehicle.motStatus;
        if (completeVehicle.motDue !== null && completeVehicle.motDue !== undefined) carData.motDue = completeVehicle.motDue;
        if (completeVehicle.motExpiry !== null && completeVehicle.motExpiry !== undefined) carData.motExpiry = completeVehicle.motExpiry;
        if (completeVehicle.motHistory !== null && completeVehicle.motHistory !== undefined) carData.motHistory = completeVehicle.motHistory;
        if (completeVehicle.runningCosts !== null && completeVehicle.runningCosts !== undefined) carData.runningCosts = completeVehicle.runningCosts;
        if (completeVehicle.historyCheckId !== null && completeVehicle.historyCheckId !== undefined) carData.historyCheckId = completeVehicle.historyCheckId;
        if (completeVehicle.historyCheckStatus !== null && completeVehicle.historyCheckStatus !== undefined) carData.historyCheckStatus = completeVehicle.historyCheckStatus;
        if (completeVehicle.historyCheckDate !== null && completeVehicle.historyCheckDate !== undefined) carData.historyCheckDate = completeVehicle.historyCheckDate;
        
        console.log(`✅ Universal Service data applied (consolidated from all sources)`);
        console.log(`   Transmission: ${carData.transmission}`);
        console.log(`   Emission Class: ${carData.emissionClass}`);
        console.log(`   Doors: ${carData.doors}, Seats: ${carData.seats}`);
        console.log(`   Running Costs: Urban ${carData.fuelEconomyUrban}mpg, Combined ${carData.fuelEconomyCombined}mpg`);
        console.log(`   Annual Tax: £${carData.annualTax}, Insurance Group: ${carData.insuranceGroup}`);
        console.log(`   CO2 Emissions: ${carData.co2Emissions}g/km`);
        console.log('🔍 [CONTROLLER DEBUG] carData.runningCosts:', JSON.stringify(carData.runningCosts, null, 2));
      } catch (universalError) {
        console.warn(`⚠️  Universal Service lookup failed, using DVLA data as fallback: ${universalError.message}`);
        // Continue with DVLA data if Universal Service fails
      }

      // Step 3: Automatically fetch coordinates and location name from postcode
      if (postcode) {
        try {
          console.log(`[Vehicle Controller] Fetching coordinates for postcode: ${postcode}`);
          const postcodeService = require('../services/postcodeService');
          const postcodeData = await postcodeService.lookupPostcode(postcode);
          
          if (postcodeData) {
            // Add coordinates to car data
            carData.coordinates = {
              latitude: postcodeData.latitude,
              longitude: postcodeData.longitude
            };
            
            // Add location name to car data
            carData.locationName = postcodeData.locationName;
            
            console.log(`[Vehicle Controller] Coordinates set: ${postcodeData.latitude}, ${postcodeData.longitude}`);
            console.log(`[Vehicle Controller] Location name set: ${postcodeData.locationName}`);
          }
        } catch (postcodeError) {
          // Don't fail car creation if postcode lookup fails
          console.warn(`[Vehicle Controller] Failed to fetch postcode data: ${postcodeError.message}`);
        }
      }

      // Add purchase information to car data
      carData.purchaseId = purchaseId;
      carData.packageName = purchase.packageName;
      carData.packageDuration = purchase.duration;
      carData.expiresAt = purchase.expiresAt;

      // Add user ID if authenticated
      if (req.user) {
        const userId = req.user._id || req.user.id;
        carData.userId = userId;
        console.log('[Vehicle Controller] Setting userId:', userId);
      }

      // Step 4: Enhance electric vehicle data if applicable
      if (carData.fuelType === 'Electric') {
        console.log(`[Vehicle Controller] Electric vehicle detected - enhancing with EV data`);
        
        // Enhance with comprehensive electric vehicle data
        const enhancedCarData = ElectricVehicleEnhancementService.enhanceWithEVData(carData);
        
        // Also use auto data population for additional defaults
        const fullyEnhancedData = AutoDataPopulationService.populateMissingData(enhancedCarData);
        
        // Update carData with enhanced data
        Object.assign(carData, fullyEnhancedData);
        
        console.log(`✅ Enhanced electric vehicle data:`);
        console.log(`   - Range: ${carData.electricRange} miles`);
        console.log(`   - Battery: ${carData.batteryCapacity} kWh`);
        console.log(`   - Rapid charging: ${carData.rapidChargingSpeed}kW`);
      }

      // Step 5: Create Car record
      // CRITICAL: Normalize make to AutoTrader format
      carData.make = normalizeMake(carData.make);
      const car = new Car(carData);

      // CRITICAL: Normalize model/variant BEFORE saving
      // This ensures proper organization in filter sidebar
      const makeUpper = car.make ? car.make.toUpperCase() : '';
      const modelStr = car.model ? car.model.trim() : '';
      const variantStr = car.variant ? car.variant.trim() : '';
      
      // Volkswagen: Golf GTE → Golf, Polo Match → Polo
      if (makeUpper === 'VOLKSWAGEN') {
        if (modelStr.startsWith('Golf ') && modelStr !== 'Golf') {
          const variantPart = modelStr.replace('Golf ', '').trim();
          console.log(`🔄 [Normalization] VW Golf: "${modelStr}" → "Golf", variant: "${variantPart}"`);
          car.model = 'Golf';
          car.variant = variantPart || variantStr;
        } else if (modelStr.startsWith('Polo ') && modelStr !== 'Polo') {
          const variantPart = modelStr.replace('Polo ', '').trim();
          console.log(`🔄 [Normalization] VW Polo: "${modelStr}" → "Polo", variant: "${variantPart}"`);
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
          console.log(`🔄 [Normalization] Audi: "${modelStr}" → "${baseModel}", variant: "${variantPart}"`);
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
            console.log(`🔄 [Normalization] Mercedes: "${modelStr}" → "${baseModel}"`);
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
          console.log(`🔄 [Normalization] Body type: "${car.bodyType}" → "${normalized}"`);
          car.bodyType = normalized;
        }
      }

      await car.save();

      // REMOVED: Second Universal Service call - data already fetched above (line 203)
      // The Universal Service was already called before car creation to populate carData
      // Calling it again here causes duplicate API calls and wastes money
      // The car.save() will use the data already in carData from the first Universal Service call

      // Update purchase record with vehicle ID
      purchase.vehicleId = car._id;
      purchase.registration = car.registrationNumber;
      await purchase.save();

      console.log(`[Vehicle Controller] Created vehicle: ${car._id} with purchase: ${purchaseId}`);

      // Step 5: Return success response
      return res.status(201).json({
        success: true,
        message: 'Vehicle successfully added from DVLA data',
        vehicle: {
          id: car._id,
          make: car.make,
          model: car.model,
          year: car.year,
          color: car.color,
          fuelType: car.fuelType,
          mileage: car.mileage,
          registrationNumber: car.registrationNumber,
          engineSize: car.engineSize,
          co2Emissions: car.co2Emissions,
          taxStatus: car.taxStatus,
          motStatus: car.motStatus,
          dataSource: car.dataSource,
          price: car.price
        }
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in lookupAndCreateVehicle:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VEHICLE_CREATION_ERROR',
          message: error.message || 'Failed to create vehicle record',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }

  /**
   * POST /api/vehicles/dvla-lookup
   * Lookup vehicle from DVLA without creating database record
   * Enhanced to also fetch data from CheckCarDetails for comprehensive information
   * CRITICAL: Checks database FIRST to avoid duplicate API calls
   */
  async dvlaLookup(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber } = req.body;

      console.log(`[Vehicle Controller] Enhanced lookup for: ${registrationNumber}`);
      
      // CRITICAL: Check database FIRST to avoid duplicate API calls
      const Car = require('../models/Car');
      const VehicleHistory = require('../models/VehicleHistory');
      
      const existingCar = await Car.findOne({ 
        registrationNumber: registrationNumber.toUpperCase() 
      });
      
      if (existingCar) {
        console.log(`✅ [Vehicle Controller] Car already exists in database - returning cached data`);
        console.log(`   Status: ${existingCar.advertStatus}`);
        console.log(`   MOT Due: ${existingCar.motDue ? new Date(existingCar.motDue).toDateString() : 'NOT SET'}`);
        console.log(`   💰 Saved API call cost!`);
        
        // Return existing car data in the same format as API response
        return res.json({
          success: true,
          data: {
            make: existingCar.make,
            model: existingCar.model,
            colour: existingCar.color,
            fuelType: existingCar.fuelType,
            yearOfManufacture: existingCar.year,
            engineCapacity: existingCar.engineSize,
            bodyType: existingCar.bodyType,
            transmission: existingCar.transmission,
            previousOwners: existingCar.previousOwners || 0,
            vin: existingCar.vin,
            co2Emissions: existingCar.co2Emissions,
            taxStatus: existingCar.taxStatus,
            taxDueDate: existingCar.taxDueDate,
            motStatus: existingCar.motStatus,
            motExpiryDate: existingCar.motDue || existingCar.motExpiry,
            _sources: {
              database: true,
              dvla: false,
              checkCarDetails: false
            },
            _existingCarId: existingCar._id,
            _message: 'Vehicle already exists in database - using cached data to save API costs'
          },
          vehicle: {
            make: existingCar.make,
            model: existingCar.model,
            colour: existingCar.color,
            fuelType: existingCar.fuelType,
            yearOfManufacture: existingCar.year,
            engineCapacity: existingCar.engineSize,
            bodyType: existingCar.bodyType,
            transmission: existingCar.transmission,
            previousOwners: existingCar.previousOwners || 0,
            vin: existingCar.vin,
            co2Emissions: existingCar.co2Emissions,
            taxStatus: existingCar.taxStatus,
            taxDueDate: existingCar.taxDueDate,
            motStatus: existingCar.motStatus,
            motExpiryDate: existingCar.motDue || existingCar.motExpiry
          }
        });
      }
      
      // Check VehicleHistory cache (30-day cache)
      const cachedHistory = await VehicleHistory.findOne({ 
        vrm: registrationNumber.toUpperCase() 
      }).sort({ checkDate: -1 });
      
      if (cachedHistory) {
        const daysSinceCheck = (Date.now() - cachedHistory.checkDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck <= 30) {
          console.log(`✅ [Vehicle Controller] Found cached VehicleHistory (${Math.floor(daysSinceCheck)} days old)`);
          console.log(`   💰 Saved API call cost!`);
          
          // Return cached history data
          return res.json({
            success: true,
            data: {
              make: cachedHistory.make,
              model: cachedHistory.model,
              colour: cachedHistory.colour,
              fuelType: cachedHistory.fuelType,
              yearOfManufacture: cachedHistory.yearOfManufacture,
              engineCapacity: cachedHistory.engineCapacity,
              bodyType: cachedHistory.bodyType,
              transmission: cachedHistory.transmission,
              previousOwners: cachedHistory.previousOwners || cachedHistory.numberOfPreviousKeepers || 0,
              vin: cachedHistory.vin,
              co2Emissions: cachedHistory.co2Emissions,
              motStatus: cachedHistory.motStatus,
              motExpiryDate: cachedHistory.motExpiryDate,
              _sources: {
                database: true,
                cache: true,
                dvla: false,
                checkCarDetails: false
              },
              _cacheAge: Math.floor(daysSinceCheck),
              _message: 'Using cached vehicle history to save API costs'
            },
            vehicle: {
              make: cachedHistory.make,
              model: cachedHistory.model,
              colour: cachedHistory.colour,
              fuelType: cachedHistory.fuelType,
              yearOfManufacture: cachedHistory.yearOfManufacture,
              engineCapacity: cachedHistory.engineCapacity,
              bodyType: cachedHistory.bodyType,
              transmission: cachedHistory.transmission,
              previousOwners: cachedHistory.previousOwners || cachedHistory.numberOfPreviousKeepers || 0,
              vin: cachedHistory.vin,
              co2Emissions: cachedHistory.co2Emissions,
              motStatus: cachedHistory.motStatus,
              motExpiryDate: cachedHistory.motExpiryDate
            }
          });
        }
      }
      
      // No cache found - make API calls
      console.log(`⚠️  [Vehicle Controller] No cache found - making API calls...`);
      
      try {
        // Call both APIs in parallel for faster response
        const [dvlaResult, historyResult] = await Promise.allSettled([
          dvlaService.lookupVehicle(registrationNumber),
          historyService.checkVehicleHistory(registrationNumber, false)
        ]);
        
        // Process DVLA result
        let dvlaData = null;
        if (dvlaResult.status === 'fulfilled') {
          dvlaData = dvlaResult.value;
          console.log(`[Vehicle Controller] DVLA lookup successful`);
        } else {
          console.log(`[Vehicle Controller] DVLA lookup failed:`, dvlaResult.reason?.message);
        }
        
        // Process CheckCarDetails result
        let historyData = null;
        if (historyResult.status === 'fulfilled') {
          historyData = historyResult.value;
          console.log(`[Vehicle Controller] CheckCarDetails lookup successful`);
        } else {
          console.log(`[Vehicle Controller] CheckCarDetails lookup failed:`, historyResult.reason?.message);
        }
        
        // Merge data - prioritize CheckCarDetails for model info as it's more comprehensive
        const mergedData = {
          // Basic info - prefer CheckCarDetails
          make: historyData?.make || dvlaData?.make || 'Unknown',
          model: historyData?.model || dvlaData?.model || 'Unknown',
          colour: historyData?.colour || dvlaData?.colour || dvlaData?.color || 'Unknown',
          fuelType: historyData?.fuelType || dvlaData?.fuelType || 'Unknown',
          yearOfManufacture: historyData?.yearOfManufacture || dvlaData?.yearOfManufacture || dvlaData?.year,
          engineCapacity: historyData?.engineCapacity || dvlaData?.engineCapacity,
          bodyType: historyData?.bodyType || dvlaData?.bodyType,
          transmission: historyData?.transmission || dvlaData?.transmission,
          
          // Additional info from CheckCarDetails
          previousOwners: historyData?.previousOwners || historyData?.numberOfPreviousKeepers || 0,
          vin: historyData?.vin,
          co2Emissions: historyData?.co2Emissions || dvlaData?.co2Emissions,
          
          // DVLA specific
          taxStatus: dvlaData?.taxStatus,
          taxDueDate: dvlaData?.taxDueDate,
          motStatus: dvlaData?.motStatus,
          motExpiryDate: dvlaData?.motExpiryDate,
          
          // Metadata
          _sources: {
            dvla: dvlaResult.status === 'fulfilled',
            checkCarDetails: historyResult.status === 'fulfilled'
          }
        };
        
        // Return merged data
        return res.json({
          success: true,
          data: mergedData,
          vehicle: mergedData
        });
      } catch (error) {
        console.error(`[Vehicle Controller] Lookup failed for: ${registrationNumber}`, error.message);
        
        // Return appropriate error based on error type
        let statusCode = 500;
        let errorMessage = 'Failed to lookup vehicle';
        
        if (error.message === 'VEHICLE_NOT_FOUND') {
          statusCode = 404;
          errorMessage = 'Vehicle not found in DVLA database';
        } else if (error.message === 'INVALID_REGISTRATION') {
          statusCode = 400;
          errorMessage = 'Invalid registration number format';
        } else if (error.message === 'AUTH_ERROR') {
          statusCode = 401;
          errorMessage = 'DVLA API authentication failed - please check API key';
        } else if (error.message === 'RATE_LIMIT') {
          statusCode = 429;
          errorMessage = 'DVLA API rate limit exceeded';
        } else if (error.message === 'NETWORK_ERROR') {
          statusCode = 503;
          errorMessage = 'Unable to connect to DVLA API';
        }
        
        return res.status(statusCode).json({
          success: false,
          error: {
            code: error.message,
            message: errorMessage
          }
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/vehicles/validate-registration
   * Validate registration number format
   */
  async validateRegistration(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { registrationNumber } = req.body;

      // Validate format
      const isValid = dvlaService.validateRegistrationFormat(registrationNumber);

      if (isValid) {
        return res.json({
          success: true,
          valid: true,
          message: 'Registration number format is valid'
        });
      } else {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Invalid UK registration number format'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles/:id
   * Get a single car by ID (MongoDB _id) or advertId (UUID)
   * Optional query param: postcode - to calculate distance from user location
   */
  async getCarById(req, res, next) {
    try {
      const { id } = req.params;
      const { postcode } = req.query;

      let car;
      
      // Try to find by MongoDB _id first, then by advertId if that fails
      // CRITICAL FIX: Use .lean() to get Mixed type fields like businessLogo/businessWebsite
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          car = await Car.findById(id).populate('historyCheckId').lean();
        }
      } catch (castError) {
        // Ignore cast errors and try advertId lookup
      }
      
      // If not found by _id or not a valid ObjectId, try advertId (UUID)
      if (!car) {
        car = await Car.findOne({ advertId: id }).populate('historyCheckId').lean();
      }

      if (!car) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAR_NOT_FOUND',
            message: 'Car not found'
          }
        });
      }

      // car is already a plain object from .lean(), no need for toObject()
      const carData = car;

      // Clean up "null" string values
      this.cleanNullStrings(carData);
      
      // CRITICAL FIX: Ensure runningCosts is properly structured for frontend
      // Frontend expects: runningCosts.fuelEconomy.urban/extraUrban/combined
      // But database might have legacy fields: fuelEconomyUrban, fuelEconomyExtraUrban, fuelEconomyCombined
      if (!carData.runningCosts || !carData.runningCosts.fuelEconomy) {
        carData.runningCosts = {
          fuelEconomy: {
            urban: carData.fuelEconomyUrban || carData.urbanMpg || '',
            extraUrban: carData.fuelEconomyExtraUrban || carData.extraUrbanMpg || '',
            combined: carData.fuelEconomyCombined || carData.combinedMpg || ''
          },
          co2Emissions: carData.co2Emissions || '',
          insuranceGroup: carData.insuranceGroup || '',
          annualTax: carData.annualTax || ''
        };
        console.log('🔧 [getCarById] Structured runningCosts from legacy fields:', {
          urban: carData.runningCosts.fuelEconomy.urban,
          extraUrban: carData.runningCosts.fuelEconomy.extraUrban,
          combined: carData.runningCosts.fuelEconomy.combined
        });
      }
      
      // CRITICAL FIX: Auto-sync running costs from VehicleHistory if missing
      // This ensures running costs are ALWAYS displayed on frontend
      if (car.registrationNumber && (!carData.runningCosts?.fuelEconomy?.combined || !carData.runningCosts?.co2Emissions)) {
        try {
          const VehicleHistory = require('../models/VehicleHistory');
          const history = await VehicleHistory.findOne({ vrm: car.registrationNumber }).sort({ checkDate: -1 });
          
          if (history && (history.combinedMpg || history.co2Emissions)) {
            console.log(`🔄 Auto-syncing running costs for ${car.registrationNumber} from VehicleHistory`);
            
            // Update carData with running costs from history
            carData.runningCosts = {
              fuelEconomy: {
                urban: history.urbanMpg,
                extraUrban: history.extraUrbanMpg,
                combined: history.combinedMpg
              },
              co2Emissions: history.co2Emissions,
              insuranceGroup: history.insuranceGroup,
              annualTax: history.annualTax,
              emissionClass: history.emissionClass
            };
            
            // Also update legacy fields for backward compatibility
            carData.urbanMpg = history.urbanMpg;
            carData.extraUrbanMpg = history.extraUrbanMpg;
            carData.combinedMpg = history.combinedMpg;
            carData.co2Emissions = history.co2Emissions;
            carData.insuranceGroup = history.insuranceGroup;
            carData.annualTax = history.annualTax;
            
            // Save to database for future requests (async, don't wait)
            // CRITICAL FIX: Since we used .lean(), car is a plain object, need to use findByIdAndUpdate
            setImmediate(async () => {
              try {
                await Car.findByIdAndUpdate(car._id, {
                  $set: {
                    runningCosts: carData.runningCosts,
                    urbanMpg: history.urbanMpg,
                    extraUrbanMpg: history.extraUrbanMpg,
                    combinedMpg: history.combinedMpg,
                    co2Emissions: history.co2Emissions,
                    insuranceGroup: history.insuranceGroup,
                    annualTax: history.annualTax
                  }
                });
                console.log(`✅ Running costs saved to Car document for ${car.registrationNumber}`);
              } catch (saveError) {
                console.error(`⚠️ Failed to save running costs to Car:`, saveError.message);
              }
            });
            
            console.log(`✅ Running costs synced: MPG=${history.combinedMpg}, CO2=${history.co2Emissions}, Tax=£${history.annualTax || 'N/A'}, Insurance=${history.insuranceGroup || 'N/A'}`);
          }
        } catch (syncError) {
          console.warn(`⚠️ Failed to auto-sync running costs:`, syncError.message);
          // Continue without running costs - not critical for display
        }
      }
      
      // Ensure allValuations is properly structured for frontend
      // Frontend expects: allValuations.private, allValuations.retail, allValuations.trade
      if (carData.valuation && !carData.allValuations) {
        carData.allValuations = {
          private: carData.valuation.privatePrice || carData.price,
          retail: carData.valuation.dealerPrice || carData.price,
          trade: carData.valuation.partExchangePrice || carData.price
        };
        console.log('💰 Structured allValuations from database valuation:', carData.allValuations);
      }
      
      // If allValuations exists but estimatedValue doesn't match private price, update it
      if (carData.allValuations?.private && carData.estimatedValue !== carData.allValuations.private) {
        console.log(`💰 Updating estimatedValue: £${carData.estimatedValue} → £${carData.allValuations.private} (Private Sale)`);
        carData.estimatedValue = carData.allValuations.private;
      }

      // Calculate distance if postcode is provided
      if (postcode) {
        try {
          const postcodeService = require('../services/postcodeService');
          const haversine = require('../utils/haversine');
          
          // Check if car has coordinates (either in coordinates object or separate fields)
          let carLat, carLon;
          
          if (car.coordinates && car.coordinates.latitude && car.coordinates.longitude) {
            // Coordinates in object format
            carLat = car.coordinates.latitude;
            carLon = car.coordinates.longitude;
          } else if (car.latitude && car.longitude) {
            // Coordinates in separate fields
            carLat = car.latitude;
            carLon = car.longitude;
          }
          
          if (carLat && carLon) {
            const postcodeData = await postcodeService.lookupPostcode(postcode);
            
            if (postcodeData) {
              const distance = haversine(
                postcodeData.latitude,
                postcodeData.longitude,
                carLat,
                carLon
              );
              carData.distance = Math.round(distance);
              console.log(`[Vehicle Controller] Calculated distance: ${carData.distance} miles from ${postcode}`);
            }
          } else {
            console.log(`[Vehicle Controller] Car has no coordinates, cannot calculate distance`);
          }
        } catch (distanceError) {
          console.warn(`[Vehicle Controller] Failed to calculate distance:`, distanceError.message);
          // Don't fail the request if distance calculation fails
        }
      }

      // If this is a trade dealer listing, fetch dealer information
      if (car.dealerId) {
        const TradeDealer = require('../models/TradeDealer');
        const dealer = await TradeDealer.findById(car.dealerId).select('businessName tradingName logo website phone email businessAddress');
        
        if (dealer) {
          // Add dealer logo to car data
          carData.dealerLogo = dealer.logo;
          
          // Add dealer business address
          if (dealer.businessAddress) {
            carData.dealerBusinessAddress = dealer.businessAddress;
          }
          
          // Enhance seller contact info with dealer details
          if (!carData.sellerContact) {
            carData.sellerContact = {};
          }
          carData.sellerContact.businessName = dealer.businessName;
          carData.sellerContact.tradingName = dealer.tradingName; // CRITICAL: Add trading name
          
          // Only add logo if it exists
          if (dealer.logo) {
            carData.sellerContact.businessLogo = dealer.logo; // CRITICAL: Add logo to sellerContact
          }
          
          // Only add website if it exists
          if (dealer.website) {
            carData.sellerContact.businessWebsite = dealer.website; // CRITICAL: Add website to sellerContact
          }
          
          carData.sellerContact.type = 'trade';
          carData.sellerContact.phoneNumber = carData.sellerContact.phoneNumber || dealer.phone;
          
          // Add business address to seller contact
          if (dealer.businessAddress) {
            carData.sellerContact.businessAddress = dealer.businessAddress;
          }
          
          console.log('[getCarById] Added TradeDealer info to response:', {
            businessName: dealer.businessName,
            tradingName: dealer.tradingName,
            logo: dealer.logo,
            website: dealer.website,
            address: dealer.businessAddress
          });
        }
      }

      // Return car data with dealer info
      // CRITICAL: Add cache-control headers to prevent stale data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      return res.json({
        success: true,
        data: carData
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid car ID format'
          }
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/vehicles/count
   * Get total count of available cars
   */
  async getCarCount(req, res, next) {
    try {
      const { 
        make, 
        model, 
        minPrice, 
        maxPrice, 
        fuelType, 
        transmission,
        condition,
        vehicleType
      } = req.query;

      // Build query - count active cars (and draft in test mode)
      const query = {};
      
      // In production, only count active cars. In test mode, count both active and draft
      if (process.env.SHOW_DRAFT_CARS === 'true') {
        query.advertStatus = { $in: ['active', 'draft'] };
      } else {
        query.advertStatus = 'active';
      }

      if (make) query.make = new RegExp(make, 'i');
      if (model) query.model = new RegExp(model, 'i');
      if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
      if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
      if (fuelType) query.fuelType = fuelType;
      if (transmission) query.transmission = transmission;
      if (condition) query.condition = condition;
      if (vehicleType) query.vehicleType = vehicleType;
      
      // For new cars, only show trade dealer listings
      if (condition === 'new') {
        query.isDealerListing = true;
      }

      // Get count
      const count = await Car.countDocuments(query);

      return res.json({
        success: true,
        count: count
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles
   * Get all cars with optional filters
   */
  async getAllCars(req, res, next) {
    try {
      const { 
        make, 
        model, 
        minPrice, 
        maxPrice, 
        fuelType, 
        transmission,
        condition,
        isDealerListing,
        vehicleType,
        limit = 50,
        skip = 0 
      } = req.query;

      // Build query - don't filter by advertStatus to show all cars
      const query = {};

      if (make) query.make = new RegExp(make, 'i');
      if (model) query.model = new RegExp(model, 'i');
      if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
      if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
      if (fuelType) query.fuelType = fuelType;
      if (transmission) query.transmission = transmission;
      if (condition) query.condition = condition;
      if (isDealerListing === 'true') query.isDealerListing = true;
      if (vehicleType) query.vehicleType = vehicleType;
      
      // For new cars, only show trade dealer listings
      if (condition === 'new') {
        query.isDealerListing = true;
      }

      // Execute query
      // CRITICAL FIX: Use .lean() to get Mixed type fields like businessLogo/businessWebsite
      const cars = await Car.find(query)
        .lean()
        .populate('historyCheckId', 'writeOffCategory writeOffDetails')
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ createdAt: -1 });

      const total = await Car.countDocuments(query);

      return res.json({
        success: true,
        data: cars,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/vehicles/search
   * Search cars with comprehensive filters
   */
  async searchCars(req, res, next) {
    try {
      console.log('🔴 [Vehicle Controller] ========================================');
      console.log('🔴 [Vehicle Controller] SEARCH ENDPOINT CALLED');
      console.log('🔴 [Vehicle Controller] Full req.query:', req.query);
      console.log('🔴 [Vehicle Controller] ========================================');
      
      const { 
        make, 
        model,
        submodel,
        priceFrom,
        priceTo,
        yearFrom,
        yearTo,
        mileageFrom,
        mileageTo,
        gearbox,
        bodyType,
        colour,
        doors,
        seats,
        fuelType,
        engineSize,
        sellerType,
        writeOffStatus,
        sort,
        limit = 50,
        skip = 0 
      } = req.query;

      console.log('🔴 [Vehicle Controller] Search params received:', { 
        sellerType, 
        writeOffStatus, 
        make, 
        model,
        engineSize,
        fuelType
      });

      // Build query - show active cars (and draft in test mode)
      const query = {};
      
      // In production, only show active cars. In test mode, show both active and draft
      if (process.env.SHOW_DRAFT_CARS === 'true') {
        query.advertStatus = { $in: ['active', 'draft'] };
        console.log('[Vehicle Controller] TEST MODE: Showing both active and draft cars');
      } else {
        query.advertStatus = 'active';
      }

      // Make, Model, and Submodel filters (case-insensitive exact match)
      if (make) query.make = new RegExp(`^${make}$`, 'i');
      if (model) query.model = new RegExp(`^${model}$`, 'i');
      // Frontend sends "submodel" but we store it in "variant" field
      if (submodel) query.variant = new RegExp(`^${submodel}$`, 'i');
      
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
      if (gearbox) query.transmission = gearbox;
      if (bodyType) query.bodyType = bodyType;
      if (colour) query.color = colour; // Map 'colour' param to 'color' field
      
      // Fuel type filter - handle hybrid variants properly
      if (fuelType) {
        if (fuelType === 'Hybrid') {
          // If user selects "Hybrid", match all hybrid types
          query.fuelType = { 
            $in: ['Hybrid', 'Petrol Hybrid', 'Diesel Hybrid', 'Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid'] 
          };
          console.log('[Vehicle Controller] Fuel type filter: Searching for all Hybrid variants');
        } else if (fuelType === 'Petrol Hybrid') {
          // Match both "Petrol Hybrid" and "Hybrid" (for backwards compatibility)
          query.fuelType = { $in: ['Petrol Hybrid', 'Hybrid'] };
          console.log('[Vehicle Controller] Fuel type filter: Searching for Petrol Hybrid vehicles');
        } else if (fuelType === 'Diesel Hybrid') {
          // Match both "Diesel Hybrid" and "Hybrid" (for backwards compatibility)
          query.fuelType = { $in: ['Diesel Hybrid', 'Hybrid'] };
          console.log('[Vehicle Controller] Fuel type filter: Searching for Diesel Hybrid vehicles');
        } else if (fuelType === 'Plug-in Hybrid') {
          // Match all plug-in hybrid types
          query.fuelType = { $in: ['Plug-in Hybrid', 'Petrol Plug-in Hybrid', 'Diesel Plug-in Hybrid'] };
          console.log('[Vehicle Controller] Fuel type filter: Searching for Plug-in Hybrid vehicles');
        } else if (fuelType === 'Petrol Plug-in Hybrid') {
          query.fuelType = { $in: ['Petrol Plug-in Hybrid', 'Plug-in Hybrid'] };
          console.log('[Vehicle Controller] Fuel type filter: Searching for Petrol Plug-in Hybrid vehicles');
        } else if (fuelType === 'Diesel Plug-in Hybrid') {
          query.fuelType = { $in: ['Diesel Plug-in Hybrid', 'Plug-in Hybrid'] };
          console.log('[Vehicle Controller] Fuel type filter: Searching for Diesel Plug-in Hybrid vehicles');
        } else {
          // Exact match for Petrol, Diesel, Electric
          query.fuelType = fuelType;
          console.log('[Vehicle Controller] Fuel type filter: Searching for', fuelType, 'vehicles');
        }
      }
      
      // Numeric filters
      if (doors) query.doors = parseInt(doors);
      if (seats) query.seats = parseInt(seats);
      
      // Engine size filter
      if (engineSize) {
        // Frontend sends values like: "1.0", "1.5", "2.0", "2.5", "3.0", "3.0+"
        // Database stores engineSize in liters (e.g., 2.0, 1.6, 3.0)
        // FIXED: Use inclusive ranges with $gte and $lte to avoid missing boundary values
        // IMPORTANT: Exclude electric vehicles from engine size filter
        
        if (engineSize === '1.0') {
          // Up to 1.0L (inclusive)
          query.engineSize = { $lte: 1.0 };
        } else if (engineSize === '1.5') {
          // 1.0L - 1.5L (inclusive on both ends)
          query.engineSize = { $gte: 1.0, $lte: 1.5 };
        } else if (engineSize === '2.0') {
          // 1.5L - 2.0L (inclusive on both ends)
          query.engineSize = { $gte: 1.5, $lte: 2.0 };
        } else if (engineSize === '2.5') {
          // 2.0L - 2.5L (inclusive on both ends)
          query.engineSize = { $gte: 2.0, $lte: 2.5 };
        } else if (engineSize === '3.0') {
          // 2.5L - 3.0L (inclusive on both ends)
          query.engineSize = { $gte: 2.5, $lte: 3.0 };
        } else if (engineSize === '3.0+') {
          // 3.0L+ = 3.0L and above (inclusive)
          query.engineSize = { $gte: 3.0 };
        }
        
        // CRITICAL: Exclude pure electric vehicles from engine size filter
        // Electric vehicles don't have engines, only electric motors
        query.fuelType = { 
          $nin: ['Electric'] // Exclude pure electric vehicles
        };
        
        console.log('[Vehicle Controller] Engine size filter applied:', engineSize, '→', query.engineSize);
        console.log('[Vehicle Controller] Excluding fuel types:', query.fuelType);
      }
      
      // Seller type filter - MUTUALLY EXCLUSIVE
      if (sellerType) {
        if (sellerType === 'private') {
          // Private sellers: exclude trade sellers
          // Must NOT have dealerId, isDealerListing=true, or sellerContact.type='trade'
          query.$and = query.$and || [];
          query.$and.push(
            { $or: [{ dealerId: { $exists: false } }, { dealerId: null }] },
            { $or: [{ isDealerListing: { $exists: false } }, { isDealerListing: false }, { isDealerListing: null }] },
            { $or: [{ 'sellerContact.type': { $exists: false } }, { 'sellerContact.type': { $ne: 'trade' } }] }
          );
          console.log('[Vehicle Controller] Seller type filter: Private sellers only');
        } else if (sellerType === 'trade') {
          // Trade sellers: dealerId exists OR isDealerListing is true OR sellerContact.type is 'trade'
          if (query.$and) {
            // If $and already exists, add the $or condition to it
            query.$and.push({
              $or: [
                { dealerId: { $ne: null, $exists: true } },
                { isDealerListing: true },
                { 'sellerContact.type': 'trade' }
              ]
            });
          } else {
            query.$or = [
              { dealerId: { $ne: null, $exists: true } },
              { isDealerListing: true },
              { 'sellerContact.type': 'trade' }
            ];
          }
          console.log('[Vehicle Controller] Seller type filter: Trade sellers only');
        }
      }
      
      // Write-off status filter
      if (writeOffStatus) {
        if (writeOffStatus === 'exclude') {
          // Exclude written off vehicles
          // We need to find VehicleHistory records with write-offs, then exclude those cars
          const VehicleHistory = require('../models/VehicleHistory');
          const writtenOffVRMs = await VehicleHistory.find({
            writeOffCategory: { $nin: ['none', 'unknown', null], $exists: true }
          }).distinct('vrm');
          
          // Exclude cars with these VRMs, but include cars without registrationNumber
          if (writtenOffVRMs.length > 0) {
            // Use $or to include cars that either don't have the VRM or don't have a registrationNumber
            if (query.$or) {
              // If $or already exists (from seller type filter), wrap both in $and
              const existingOr = query.$or;
              delete query.$or;
              query.$and = [
                { $or: existingOr },
                {
                  $or: [
                    { registrationNumber: { $nin: writtenOffVRMs } },
                    { registrationNumber: { $exists: false } },
                    { registrationNumber: null }
                  ]
                }
              ];
            } else {
              query.$or = [
                { registrationNumber: { $nin: writtenOffVRMs } },
                { registrationNumber: { $exists: false } },
                { registrationNumber: null }
              ];
            }
          }
          console.log('[Vehicle Controller] Write-off filter: Excluding', writtenOffVRMs.length, 'written off vehicles');
        } else if (writeOffStatus === 'only') {
          // Show only written off vehicles
          const VehicleHistory = require('../models/VehicleHistory');
          const writtenOffVRMs = await VehicleHistory.find({
            writeOffCategory: { $nin: ['none', 'unknown', null], $exists: true }
          }).distinct('vrm');
          
          // Only show cars with these VRMs
          if (writtenOffVRMs.length > 0) {
            if (query.$or) {
              // If $or already exists (from seller type filter), wrap both in $and
              const existingOr = query.$or;
              delete query.$or;
              query.$and = [
                { $or: existingOr },
                { registrationNumber: { $in: writtenOffVRMs } }
              ];
            } else {
              query.registrationNumber = { $in: writtenOffVRMs };
            }
          } else {
            // No written off vehicles found, return empty result
            query._id = null; // This will match nothing
          }
          console.log('[Vehicle Controller] Write-off filter: Only showing', writtenOffVRMs.length, 'written off vehicles');
        }
      }
      
      console.log('[Vehicle Controller] Constructed query:', JSON.stringify(query, null, 2));

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
      // CRITICAL FIX: Use .lean() to get Mixed type fields like businessLogo/businessWebsite
      const cars = await Car.find(query)
        .lean()
        .populate('historyCheckId', 'writeOffCategory writeOffDetails')
        .limit(Math.min(parseInt(limit), 100)) // Cap at 100
        .skip(parseInt(skip))
        .sort(sortOption);

      // Clean up "null" strings in all cars
      // Since we used .lean(), cars are already plain objects
      const cleanedCars = cars.map(car => {
        return this.cleanNullStrings(car);
      });
      
      // CRITICAL FIX: Auto-sync running costs from VehicleHistory for cars missing data
      // This runs in background and doesn't slow down the response
      setImmediate(async () => {
        try {
          const VehicleHistory = require('../models/VehicleHistory');
          
          for (const car of cars) {
            // Skip if car already has running costs
            if (car.runningCosts?.fuelEconomy?.combined && car.runningCosts?.co2Emissions) {
              continue;
            }
            
            if (!car.registrationNumber) continue;
            
            const history = await VehicleHistory.findOne({ vrm: car.registrationNumber }).sort({ checkDate: -1 });
            
            if (history && (history.combinedMpg || history.co2Emissions)) {
              car.runningCosts = {
                fuelEconomy: {
                  urban: history.urbanMpg,
                  extraUrban: history.extraUrbanMpg,
                  combined: history.combinedMpg
                },
                co2Emissions: history.co2Emissions,
                insuranceGroup: history.insuranceGroup,
                annualTax: history.annualTax,
                emissionClass: history.emissionClass
              };
              
              car.urbanMpg = history.urbanMpg;
              car.extraUrbanMpg = history.extraUrbanMpg;
              car.combinedMpg = history.combinedMpg;
              car.co2Emissions = history.co2Emissions;
              car.insuranceGroup = history.insuranceGroup;
              car.annualTax = history.annualTax;
              
              await car.save();
              console.log(`✅ Background sync: Running costs saved for ${car.registrationNumber}`);
            }
          }
        } catch (syncError) {
          console.error(`⚠️ Background running costs sync failed:`, syncError.message);
        }
      });

      const total = await Car.countDocuments(query);

      console.log('[Vehicle Controller] Found', total, 'cars matching filters');

      return res.json({
        success: true,
        cars: cleanedCars,
        total: total,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in searchCars:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to search cars',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/vehicles/filter-options
   * Get unique filter options from database
   */
  async getFilterOptions(req, res, next) {
    try {
      console.log('[Vehicle Controller] Fetching filter options...');
      
      // Get ALL filter parameters from query string for dynamic filtering
      const { 
        make, model, submodel,
        fuelType, transmission, bodyType, colour,
        doors: doorsFilter, seats: seatsFilter,
        yearFrom, yearTo, priceFrom, priceTo, mileageFrom, mileageTo,
        sellerType
      } = req.query;
      
      console.log('[Vehicle Controller] Filter params:', req.query);
      
      // Build base query for active cars (and draft in test mode)
      const baseQuery = {};
      
      // In production, only show active cars. In test mode, show both active and draft
      if (process.env.SHOW_DRAFT_CARS === 'true') {
        baseQuery.advertStatus = { $in: ['active', 'draft'] };
      } else {
        baseQuery.advertStatus = 'active';
      }
      
      // Build comprehensive filtered query based on ALL selected filters
      const filteredQuery = { ...baseQuery };
      if (make) filteredQuery.make = make;
      if (model) filteredQuery.model = model;
      if (submodel) filteredQuery.variant = submodel; // Frontend sends "submodel" but we store it in "variant"
      if (fuelType) filteredQuery.fuelType = fuelType;
      if (transmission) filteredQuery.transmission = transmission;
      if (bodyType) filteredQuery.bodyType = bodyType;
      if (colour) filteredQuery.color = colour;
      if (doorsFilter) filteredQuery.doors = parseInt(doorsFilter);
      if (seatsFilter) filteredQuery.seats = parseInt(seatsFilter);
      if (sellerType) {
        if (sellerType === 'private') {
          filteredQuery.dealerId = { $exists: false };
          filteredQuery.isDealerListing = { $ne: true };
          filteredQuery['sellerContact.type'] = { $ne: 'trade' };
        } else if (sellerType === 'trade') {
          filteredQuery.$or = [
            { dealerId: { $ne: null, $exists: true } },
            { isDealerListing: true },
            { 'sellerContact.type': 'trade' }
          ];
        }
      }
      
      // Year range
      if (yearFrom || yearTo) {
        filteredQuery.year = {};
        if (yearFrom) filteredQuery.year.$gte = parseInt(yearFrom);
        if (yearTo) filteredQuery.year.$lte = parseInt(yearTo);
      }
      
      // Price range
      if (priceFrom || priceTo) {
        filteredQuery.price = {};
        if (priceFrom) filteredQuery.price.$gte = parseFloat(priceFrom);
        if (priceTo) filteredQuery.price.$lte = parseFloat(priceTo);
      }
      
      // Mileage range
      if (mileageFrom || mileageTo) {
        filteredQuery.mileage = {};
        if (mileageFrom) filteredQuery.mileage.$gte = parseInt(mileageFrom);
        if (mileageTo) filteredQuery.mileage.$lte = parseInt(mileageTo);
      }
      
      console.log('[Vehicle Controller] Comprehensive filtered query:', filteredQuery);
      
      // Get unique makes with counts (from base query, not filtered)
      const makes = await Car.distinct('make', baseQuery);
      console.log('[Vehicle Controller] Found makes:', makes.length);
      
      // Calculate counts for each make
      // For selected make: use filteredQuery (includes make filter)
      // For other makes: use makeQuery (excludes make filter)
      const makeCounts = {};
      const makeQuery = { ...filteredQuery };
      delete makeQuery.make; // Exclude make filter for non-selected makes
      console.log('[Vehicle Controller] Calculating make counts...');
      for (const makeName of makes) {
        if (makeName) {
          // If this is the currently selected make, show count with make filter
          // Otherwise show count without make filter (to show "what if I select this")
          if (make && makeName === make) {
            const count = await Car.countDocuments(filteredQuery);
            makeCounts[makeName] = count;
          } else {
            const count = await Car.countDocuments({ ...makeQuery, make: makeName });
            makeCounts[makeName] = count;
          }
        }
      }
      console.log('[Vehicle Controller] Make counts:', makeCounts);
      
      // Get unique models (filtered by baseQuery to respect current filters)
      const models = await Car.distinct('model', baseQuery);
      console.log('[Vehicle Controller] Found models:', models.length);
      
      // Calculate counts for each model
      // For selected model: use filteredQuery (includes model filter)
      // For other models: use modelQuery (excludes model filter)
      const modelCounts = {};
      const modelQuery = { ...filteredQuery };
      delete modelQuery.model; // Exclude model filter for non-selected models
      for (const modelName of models) {
        if (modelName) {
          // If this is the currently selected model, show count with model filter
          // Otherwise show count without model filter
          if (model && modelName === model) {
            const count = await Car.countDocuments(filteredQuery);
            modelCounts[modelName] = count;
          } else {
            const count = await Car.countDocuments({ ...modelQuery, model: modelName });
            modelCounts[modelName] = count;
          }
        }
      }
      
      // Get hierarchical model and submodel data
      const statusMatch = process.env.SHOW_DRAFT_CARS === 'true'
        ? { advertStatus: { $in: ['active', 'draft'] } }
        : { advertStatus: 'active' };
      const modelHierarchy = await Car.aggregate([
        { $match: statusMatch },
        {
          $group: {
            _id: { make: '$make', model: '$model' },
            submodels: { $addToSet: '$submodel' },
            variants: { $addToSet: '$variant' }
          }
        },
        {
          $group: {
            _id: '$_id.make',
            models: {
              $push: {
                model: '$_id.model',
                submodels: { $filter: { input: '$submodels', cond: { $ne: ['$$this', null] } } },
                variants: { $filter: { input: '$variants', cond: { $ne: ['$$this', null] } } }
              }
            }
          }
        }
      ]);

      // Transform hierarchy data into structured format
      const modelsByMake = {};
      const submodelsByMakeModel = {};
      const variantsByMakeModel = {};
      
      modelHierarchy.forEach(makeGroup => {
        const make = makeGroup._id;
        modelsByMake[make] = [];
        submodelsByMakeModel[make] = {};
        variantsByMakeModel[make] = {};
        
        makeGroup.models.forEach(modelGroup => {
          const model = modelGroup.model;
          if (model) {
            modelsByMake[make].push(model);
            submodelsByMakeModel[make][model] = modelGroup.submodels.filter(Boolean).sort();
            
            // Sort variants with natural/alphanumeric sorting (A-Z, 1-9)
            // This handles cases like "1.0", "1.2", "2.0" correctly
            variantsByMakeModel[make][model] = modelGroup.variants
              .filter(Boolean)
              .sort((a, b) => {
                // Natural sort that handles numbers correctly
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
              });
            
            // DEBUG: Log variants order
            if (variantsByMakeModel[make][model].length > 0) {
              console.log(`[Vehicle Controller] Variants for ${make} ${model}:`, variantsByMakeModel[make][model]);
            }
          }
        });
        
        modelsByMake[make].sort();
      });
      
      // Get unique fuel types with counts (filtered based on selection)
      let fuelTypes = await Car.distinct('fuelType', baseQuery);
      console.log('[Vehicle Controller] Found fuelTypes:', fuelTypes.length);
      
      // Calculate counts for each fuel type
      // For selected fuel type: use filteredQuery
      // For other fuel types: use fuelTypeQuery (excludes fuelType filter)
      const fuelTypeCounts = {};
      const fuelTypeQuery = { ...filteredQuery };
      delete fuelTypeQuery.fuelType;
      for (const fuelTypeValue of fuelTypes) {
        if (fuelTypeValue) {
          if (fuelType && fuelTypeValue === fuelType) {
            const count = await Car.countDocuments(filteredQuery);
            fuelTypeCounts[fuelTypeValue] = count;
          } else {
            const count = await Car.countDocuments({ ...fuelTypeQuery, fuelType: fuelTypeValue });
            fuelTypeCounts[fuelTypeValue] = count;
          }
        }
      }
      
      // Expand "Hybrid" into "Petrol Hybrid" and "Diesel Hybrid" for better filtering
      if (fuelTypes.includes('Hybrid')) {
        // Remove generic "Hybrid"
        fuelTypes = fuelTypes.filter(ft => ft !== 'Hybrid');
        // Add specific hybrid types
        fuelTypes.push('Petrol Hybrid', 'Diesel Hybrid');
      }
      
      // Sort fuel types in a logical order
      const fuelTypeOrder = [
        'Petrol', 
        'Diesel', 
        'Petrol Hybrid', 
        'Diesel Hybrid',
        'Petrol Plug-in Hybrid',
        'Diesel Plug-in Hybrid',
        'Electric'
      ];
      fuelTypes.sort((a, b) => {
        const indexA = fuelTypeOrder.indexOf(a);
        const indexB = fuelTypeOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      
      // Get unique transmissions with counts (filtered based on selection)
      const transmissions = await Car.distinct('transmission', baseQuery);
      console.log('[Vehicle Controller] Found transmissions:', transmissions.length);
      
      // Calculate counts for each transmission
      const transmissionCounts = {};
      const transmissionQuery = { ...filteredQuery };
      delete transmissionQuery.transmission;
      for (const trans of transmissions) {
        if (trans) {
          if (transmission && trans === transmission) {
            const count = await Car.countDocuments(filteredQuery);
            transmissionCounts[trans] = count;
          } else {
            const count = await Car.countDocuments({ ...transmissionQuery, transmission: trans });
            transmissionCounts[trans] = count;
          }
        }
      }
      
      // Get unique body types with counts (filtered based on selection)
      const bodyTypes = await Car.distinct('bodyType', baseQuery);
      console.log('[Vehicle Controller] Found bodyTypes:', bodyTypes.length);
      
      // Calculate counts for each body type
      const bodyTypeCounts = {};
      const bodyTypeQuery = { ...filteredQuery };
      delete bodyTypeQuery.bodyType;
      for (const bt of bodyTypes) {
        if (bt) {
          if (bodyType && bt === bodyType) {
            const count = await Car.countDocuments(filteredQuery);
            bodyTypeCounts[bt] = count;
          } else {
            const count = await Car.countDocuments({ ...bodyTypeQuery, bodyType: bt });
            bodyTypeCounts[bt] = count;
          }
        }
      }
      
      // Get unique colours with counts (filtered based on selection)
      const colours = await Car.distinct('color', baseQuery);
      console.log('[Vehicle Controller] Found colours:', colours.length);
      
      // Calculate counts for each colour
      const colourCounts = {};
      const colourQuery = { ...filteredQuery };
      delete colourQuery.color;
      for (const col of colours) {
        if (col) {
          if (colour && col === colour) {
            const count = await Car.countDocuments(filteredQuery);
            colourCounts[col] = count;
          } else {
            const count = await Car.countDocuments({ ...colourQuery, color: col });
            colourCounts[col] = count;
          }
        }
      }
      
      // Get unique doors with counts
      const doors = await Car.distinct('doors', baseQuery);
      
      // Calculate counts for each door option
      const doorCounts = {};
      const doorQuery = { ...filteredQuery };
      delete doorQuery.doors;
      for (const door of doors) {
        if (door) {
          if (doorsFilter && door === parseInt(doorsFilter)) {
            const count = await Car.countDocuments(filteredQuery);
            doorCounts[door] = count;
          } else {
            const count = await Car.countDocuments({ ...doorQuery, doors: door });
            doorCounts[door] = count;
          }
        }
      }
      
      // Get unique seats with counts
      const seats = await Car.distinct('seats', baseQuery);
      
      // Calculate counts for each seat option
      const seatCounts = {};
      const seatQuery = { ...filteredQuery };
      delete seatQuery.seats;
      for (const seat of seats) {
        if (seat) {
          if (seatsFilter && seat === parseInt(seatsFilter)) {
            const count = await Car.countDocuments(filteredQuery);
            seatCounts[seat] = count;
          } else {
            const count = await Car.countDocuments({ ...seatQuery, seats: seat });
            seatCounts[seat] = count;
          }
        }
      }
      
      // Get year range (filtered based on selection)
      const years = await Car.aggregate([
        { $match: filteredQuery },
        { $group: { _id: null, minYear: { $min: '$year' }, maxYear: { $max: '$year' } } }
      ]);
      
      const yearRange = years.length > 0 ? years[0] : { minYear: 2000, maxYear: new Date().getFullYear() };

      // Get seller type counts - MUTUALLY EXCLUSIVE
      // Trade sellers: identified by dealerId, isDealerListing, or sellerContact.type='trade'
      // Use filteredQuery to respect current filters (make, model, fuelType, etc.)
      const tradeSellerCount = await Car.countDocuments({
        ...filteredQuery,
        $or: [
          { dealerId: { $ne: null, $exists: true } },
          { isDealerListing: true },
          { 'sellerContact.type': 'trade' }
        ]
      });
      
      // Private sellers: exclude trade sellers
      // Use filteredQuery to respect current filters
      const privateSellerCount = await Car.countDocuments({
        ...filteredQuery,
        dealerId: { $exists: false },
        isDealerListing: { $ne: true },
        'sellerContact.type': { $ne: 'trade' }
      });
      
      console.log('[Vehicle Controller] Seller counts - Private:', privateSellerCount, 'Trade:', tradeSellerCount);
      
      // Get write-off status counts
      // Query VehicleHistory for written off vehicles
      const VehicleHistory = require('../models/VehicleHistory');
      const writtenOffVRMs = await VehicleHistory.find({
        writeOffCategory: { $nin: ['none', 'unknown', null], $exists: true }
      }).distinct('vrm');
      
      // Use filteredQuery to respect current filters
      const writtenOffCount = await Car.countDocuments({
        ...filteredQuery,
        registrationNumber: { $in: writtenOffVRMs }
      });
      
      // Use filteredQuery to respect current filters
      const cleanCount = await Car.countDocuments({
        ...filteredQuery,
        $or: [
          { registrationNumber: { $nin: writtenOffVRMs } },
          { registrationNumber: null }
        ]
      });
      
      // Total cars based on current filters
      const totalCars = await Car.countDocuments(filteredQuery);
      
      console.log('[Vehicle Controller] Write-off counts - Total:', totalCars, 'Written off:', writtenOffCount, 'Clean:', cleanCount);

      const result = {
        success: true,
        data: {
          makes: makes.filter(Boolean).sort(),
          models: models.filter(Boolean).sort(),
          modelsByMake,
          submodelsByMakeModel,
          variantsByMakeModel,
          fuelTypes: fuelTypes.filter(Boolean).sort(),
          transmissions: transmissions.filter(Boolean).sort(),
          bodyTypes: bodyTypes.filter(Boolean).sort(),
          colours: colours.filter(Boolean).sort(),
          doors: doors.filter(Boolean).sort((a, b) => a - b),
          seats: seats.filter(Boolean).sort((a, b) => a - b),
          yearRange: {
            min: yearRange.minYear,
            max: yearRange.maxYear
          },
          counts: {
            total: totalCars,
            privateSellers: privateSellerCount,
            tradeSellers: tradeSellerCount,
            writtenOff: writtenOffCount,
            clean: cleanCount,
            // Individual filter counts (dynamic based on other selected filters)
            makes: makeCounts,
            models: modelCounts,
            fuelTypes: fuelTypeCounts,
            transmissions: transmissionCounts,
            bodyTypes: bodyTypeCounts,
            colours: colourCounts,
            doors: doorCounts,
            seats: seatCounts
          }
        }
      };
      
      // DEBUG: Log variants data being sent
      console.log('[Vehicle Controller] variantsByMakeModel:', JSON.stringify(variantsByMakeModel, null, 2));
      
      console.log('[Vehicle Controller] Returning filter options with counts');
      
      return res.json(result);

    } catch (error) {
      console.error('[Vehicle Controller] Error in getFilterOptions:', error);
      next(error);
    }
  }

  /**
   * GET /api/vehicles/basic-lookup/:registration
   * Lightweight vehicle lookup for CarFinder form - only basic data, no expensive APIs
   */
  async basicVehicleLookup(req, res, next) {
    try {
      const { registration } = req.params;
      const { mileage } = req.query;

      console.log(`[Vehicle Controller] Basic lookup request for: ${registration}, mileage: ${mileage || 'not provided'}`);

      if (!registration) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REGISTRATION',
            message: 'Registration number is required'
          }
        });
      }

      // Validate registration format
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      if (cleanedReg.length < 2 || cleanedReg.length > 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REGISTRATION',
            message: 'Invalid registration number format'
          }
        });
      }

      // Parse mileage if provided
      const parsedMileage = mileage ? parseInt(mileage, 10) : 50000;
      
      // Wait for database connection
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('[Vehicle Controller] Waiting for database connection...');
        await new Promise((resolve) => {
          if (mongoose.connection.readyState === 1) {
            resolve();
          } else {
            mongoose.connection.once('connected', resolve);
          }
        });
      }
      
      // SIMPLE FIX: Check VehicleHistory cache first (no API calls, no database save)
      console.log(`[Vehicle Controller] ✅ FIXED VERSION - Checking VehicleHistory cache for: ${cleanedReg}`);
      
      let result;
      
      try {
        // Check if we have cached data in VehicleHistory
        const VehicleHistory = require('../models/VehicleHistory');
        const cachedData = await VehicleHistory.findOne({ 
          vrm: cleanedReg  // VehicleHistory uses 'vrm' field
        }).sort({ createdAt: -1 });
        
        if (cachedData && cachedData.make) {
          // Return from cache - NO API CALL!
          console.log(`[Vehicle Controller] ✅ Found in cache for ${cleanedReg} - NO API CALL`);
          
          result = {
            success: true,
            data: {
              make: cachedData.make || 'Unknown',
              model: cachedData.model || 'Unknown',
              variant: cachedData.variant,
              year: cachedData.yearOfManufacture,
              fuelType: cachedData.fuelType,
              transmission: cachedData.transmission,
              bodyType: cachedData.bodyType,
              engineSize: cachedData.engineCapacity,
              doors: cachedData.doors,
              seats: cachedData.seats,
              color: cachedData.colour,
              combinedMpg: cachedData.combinedMpg,
              co2Emissions: cachedData.co2Emissions,
              annualTax: cachedData.annualTax,
              insuranceGroup: cachedData.insuranceGroup,
              estimatedValue: cachedData.estimatedValue || cachedData.privatePrice,
              registrationNumber: cleanedReg,
              mileage: parsedMileage
            },
            fromCache: true,
            apiCalls: 0,
            cost: 0
          };
        } else {
          // Not in cache - need to fetch from API (only £0.05 call)
          console.log(`[Vehicle Controller] ⚠️ Not in cache for ${cleanedReg} - will fetch from API (£0.05)`);
          
          const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
          const client = new CheckCarDetailsClient();
          const rawApiData = await client.getVehicleSpecs(cleanedReg);
          
          // Extract data directly from API response (bypass parser issues)
          const vehicleId = rawApiData.VehicleIdentification || {};
          const bodyDetails = rawApiData.BodyDetails || {};
          const performance = rawApiData.Performance || {};
          const fuelEconomy = performance.FuelEconomy || {};
          const modelData = rawApiData.ModelData || {};
          const transmission = rawApiData.Transmission || {};
          const dvlaTech = rawApiData.DvlaTechnicalDetails || {};
          const emissions = rawApiData.Emissions || {};
          
          const apiData = {
            make: vehicleId.DvlaMake || modelData.Make,
            model: vehicleId.DvlaModel || modelData.Model,
            variant: modelData.Range || modelData.ModelVariant,
            year: vehicleId.YearOfManufacture,
            fuelType: modelData.FuelType || 'Unknown',
            transmission: transmission.TransmissionType || 'Unknown',
            bodyType: bodyDetails.BodyStyle || vehicleId.DvlaBodyType,
            engineSize: dvlaTech.EngineCapacityCc ? dvlaTech.EngineCapacityCc / 1000 : null,
            doors: bodyDetails.NumberOfDoors,
            seats: bodyDetails.NumberOfSeats || dvlaTech.SeatCountIncludingDriver,
            color: null, // Not in vehicleSpecs API
            urbanMpg: fuelEconomy.UrbanColdMpg,
            extraUrbanMpg: fuelEconomy.ExtraUrbanMpg,
            combinedMpg: fuelEconomy.CombinedMpg,
            co2Emissions: emissions.ManufacturerCo2 || vehicleId.DvlaCo2,
            power: performance.Power && performance.Power.Bhp ? performance.Power.Bhp : null,
          };
          
          // CRITICAL FIX: Calculate annual tax if not provided by API
          const vedDetails = rawApiData.VehicleExciseDutyDetails || {};
          apiData.annualTax = vedDetails.VedRate?.Standard?.TwelveMonths || null;
          
          if (!apiData.annualTax && apiData.co2Emissions && apiData.year) {
            const { calculateAnnualTax } = require('../utils/taxCalculator');
            const calculatedTax = calculateAnnualTax({
              year: apiData.year,
              co2Emissions: apiData.co2Emissions,
              engineSize: apiData.engineSize,
              fuelType: apiData.fuelType
            });
            
            if (calculatedTax !== null) {
              apiData.annualTax = calculatedTax;
              console.log(`💰 [BasicLookup] Calculated annual tax: £${calculatedTax} (CO2: ${apiData.co2Emissions}g/km, Year: ${apiData.year})`);
            }
          }
          
          // CRITICAL FIX: Estimate insurance group if not provided by API
          const smmtDetails = rawApiData.SmmtDetails || {};
          apiData.insuranceGroup = smmtDetails.InsuranceGroup || null;
          
          if (!apiData.insuranceGroup && apiData.engineSize && apiData.year) {
            const engineSize = parseFloat(apiData.engineSize);
            const age = new Date().getFullYear() - apiData.year;
            
            let estimatedGroup = 15; // Default middle group
            
            if (engineSize <= 1.0) {
              estimatedGroup = age > 10 ? 5 : 8;
            } else if (engineSize <= 1.4) {
              estimatedGroup = age > 10 ? 8 : 12;
            } else if (engineSize <= 1.6) {
              estimatedGroup = age > 10 ? 10 : 15;
            } else if (engineSize <= 2.0) {
              estimatedGroup = age > 10 ? 15 : 20;
            } else if (engineSize <= 3.0) {
              estimatedGroup = age > 10 ? 20 : 28;
            } else {
              estimatedGroup = age > 10 ? 25 : 35;
            }
            
            apiData.insuranceGroup = estimatedGroup;
            console.log(`🛡️ [BasicLookup] Estimated insurance group: ${estimatedGroup} (Engine: ${engineSize}L, Age: ${age} years)`);
          }
          
          console.log(`[Vehicle Controller] 🔍 Extracted API Data:`, JSON.stringify(apiData, null, 2));
          
          if (!apiData.make) {
            throw new Error('Vehicle not found in API');
          }
          
          // Cache the data in VehicleHistory for next time
          await VehicleHistory.findOneAndUpdate(
            { vrm: cleanedReg },
            {
              vrm: cleanedReg,
              make: apiData.make,
              model: apiData.model,
              variant: apiData.variant,
              yearOfManufacture: apiData.year,
              fuelType: apiData.fuelType,
              transmission: apiData.transmission,
              bodyType: apiData.bodyType,
              engineCapacity: apiData.engineSize,
              doors: apiData.doors,
              seats: apiData.seats,
              colour: apiData.color,
              urbanMpg: apiData.urbanMpg,
              extraUrbanMpg: apiData.extraUrbanMpg,
              combinedMpg: apiData.combinedMpg,
              co2Emissions: apiData.co2Emissions,
              annualTax: apiData.annualTax,
              insuranceGroup: apiData.insuranceGroup,
              estimatedValue: apiData.estimatedValue || apiData.privatePrice,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );
          
          console.log(`[Vehicle Controller] ✅ Fetched from API and cached for ${cleanedReg}`);
          
          result = {
            success: true,
            data: {
              make: apiData.make || 'Unknown',
              model: apiData.model || 'Unknown',
              variant: apiData.variant,
              year: apiData.year,
              fuelType: apiData.fuelType,
              transmission: apiData.transmission,
              bodyType: apiData.bodyType,
              engineSize: apiData.engineSize,
              doors: apiData.doors,
              seats: apiData.seats,
              color: apiData.color,
              urbanMpg: apiData.urbanMpg,
              extraUrbanMpg: apiData.extraUrbanMpg,
              combinedMpg: apiData.combinedMpg,
              co2Emissions: apiData.co2Emissions,
              annualTax: apiData.annualTax,
              insuranceGroup: apiData.insuranceGroup,
              estimatedValue: apiData.estimatedValue || apiData.privatePrice,
              registrationNumber: cleanedReg,
              mileage: parsedMileage
            },
            fromCache: false,
            apiCalls: 1,
            cost: 0.05 // Only vehicleSpecs call (NOT £2.01!)
          };
        }
        
        console.log(`[Vehicle Controller] Basic lookup successful for ${cleanedReg}`);
      } catch (lookupError) {
        console.error(`[Vehicle Controller] Basic lookup failed for ${cleanedReg}:`, lookupError.message);
        
        result = {
          success: false,
          error: lookupError.message || 'Vehicle lookup failed'
        };
      }

      if (!result.success) {
        console.error(`[Vehicle Controller] Basic lookup failed for ${registration}:`, result.error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: result.error || 'Vehicle not found'
          }
        });
      }

      console.log(`[Vehicle Controller] Basic lookup successful for ${registration}`);
      console.log(`[Vehicle Controller] From cache: ${result.fromCache}, API calls: ${result.apiCalls}, Cost: £${result.cost}`);

      // Return basic vehicle data (already unwrapped)
      return res.json({
        success: true,
        data: result.data,
        fromCache: result.fromCache,
        apiCalls: result.apiCalls,
        cost: result.cost
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in basicVehicleLookup:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during vehicle lookup',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/vehicles/enhanced-lookup/:registration
   * Enhanced vehicle lookup using both DVLA and CheckCarDetails APIs
   * Returns merged data with source tracking from both APIs
   */
  async enhancedVehicleLookup(req, res, next) {
    try {
      const { registration } = req.params;
      const { useCache = 'true', mileage } = req.query;

      console.log(`[Vehicle Controller] Enhanced lookup request for: ${registration}, mileage: ${mileage || 'not provided'}`);

      if (!registration) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REGISTRATION',
            message: 'Registration number is required'
          }
        });
      }

      // Validate registration format
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      if (cleanedReg.length < 2 || cleanedReg.length > 10) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REGISTRATION',
            message: 'Invalid registration number format'
          }
        });
      }

      // Parse mileage if provided
      const parsedMileage = mileage ? parseInt(mileage, 10) : null;
      
      // CRITICAL FIX: Don't use Universal Service for enhanced lookup (it tries to save to DB)
      // Instead, directly get vehicle data from API without saving
      console.log(`[Vehicle Controller] Fetching vehicle data for enhanced lookup: ${cleanedReg}`);
      
      let result; // Declare result outside try block
      
      try {
        // Get vehicle data directly from Universal Service without saving to database
        const vehicleDataResponse = await universalService.getVehicleData(cleanedReg, parsedMileage || 50000);
        
        if (!vehicleDataResponse.success) {
          throw new Error(vehicleDataResponse.error || 'Failed to fetch vehicle data');
        }
        
        const completeVehicle = vehicleDataResponse.data;
        
        // Structure the response data for enhanced lookup
        result = {
          success: true,
          data: {
            // Basic vehicle info
            make: completeVehicle.make,
            model: completeVehicle.model,
            variant: completeVehicle.variant,
            year: completeVehicle.year,
            fuelType: completeVehicle.fuelType,
            transmission: completeVehicle.transmission || completeVehicle.gearbox,
            bodyType: completeVehicle.bodyType,
            engineSize: completeVehicle.engineSize,
            doors: completeVehicle.doors,
            seats: completeVehicle.seats,
            color: completeVehicle.color,
            
            // Enhanced data - CRITICAL FIX: Use correct field names
            co2Emissions: completeVehicle.co2Emissions || completeVehicle.runningCosts?.co2Emissions,
            annualTax: completeVehicle.annualTax || completeVehicle.runningCosts?.annualTax,
            insuranceGroup: completeVehicle.insuranceGroup || completeVehicle.runningCosts?.insuranceGroup,
            emissionClass: completeVehicle.emissionClass || completeVehicle.runningCosts?.emissionClass,
            fuelEconomyUrban: completeVehicle.urbanMpg || completeVehicle.runningCosts?.fuelEconomy?.urban,
            fuelEconomyExtraUrban: completeVehicle.extraUrbanMpg || completeVehicle.runningCosts?.fuelEconomy?.extraUrban,
            fuelEconomyCombined: completeVehicle.combinedMpg || completeVehicle.runningCosts?.fuelEconomy?.combined,
            
            // Valuation data
            estimatedValue: completeVehicle.estimatedValue,
            privatePrice: completeVehicle.valuation?.privatePrice || completeVehicle.privatePrice,
            dealerPrice: completeVehicle.valuation?.dealerPrice || completeVehicle.dealerPrice,
            partExchangePrice: completeVehicle.valuation?.partExchangePrice || completeVehicle.partExchangePrice,
            
            // MOT and history data
            motStatus: completeVehicle.motStatus,
            motDue: completeVehicle.motDue || completeVehicle.motDueDate,
            motExpiry: completeVehicle.motExpiry || completeVehicle.motDueDate,
            motHistory: completeVehicle.motHistory,
            
            // Running costs - CRITICAL FIX: Ensure running costs object is properly structured
            runningCosts: completeVehicle.runningCosts ? {
              fuelEconomy: {
                urban: completeVehicle.urbanMpg || completeVehicle.runningCosts.fuelEconomy?.urban,
                extraUrban: completeVehicle.extraUrbanMpg || completeVehicle.runningCosts.fuelEconomy?.extraUrban,
                combined: completeVehicle.combinedMpg || completeVehicle.runningCosts.fuelEconomy?.combined
              },
              co2Emissions: completeVehicle.co2Emissions || completeVehicle.runningCosts.co2Emissions,
              insuranceGroup: completeVehicle.insuranceGroup || completeVehicle.runningCosts.insuranceGroup,
              annualTax: completeVehicle.annualTax || completeVehicle.runningCosts.annualTax,
              emissionClass: completeVehicle.emissionClass || completeVehicle.runningCosts.emissionClass
            } : {
              fuelEconomy: {
                urban: completeVehicle.urbanMpg,
                extraUrban: completeVehicle.extraUrbanMpg,
                combined: completeVehicle.combinedMpg
              },
              co2Emissions: completeVehicle.co2Emissions,
              insuranceGroup: completeVehicle.insuranceGroup,
              annualTax: completeVehicle.annualTax,
              emissionClass: completeVehicle.emissionClass
            },
            
            // Metadata
            registrationNumber: cleanedReg,
            mileage: parsedMileage || completeVehicle.mileage || 50000,
            
            // Data sources tracking
            dataSources: {
              dvla: true,
              checkCarDetails: true,
              universalService: true
            }
          },
          warnings: []
        };
        
        console.log(`[Vehicle Controller] Universal Service enhanced lookup successful for ${cleanedReg}`);
        console.log(`[Vehicle Controller] Complete vehicle data populated through Universal Service`);
        console.log('🔍 [ENHANCED LOOKUP DEBUG] Running costs in result:', JSON.stringify(result.data.runningCosts, null, 2));
      } catch (universalError) {
        console.error(`[Vehicle Controller] Universal Service enhanced lookup failed for ${cleanedReg}:`, universalError.message);
        console.error(universalError.stack);
        
        // Return error in expected format
        result = {
          success: false,
          error: universalError.message || 'Failed to lookup vehicle data from all sources'
        };
      }

      if (!result.success) {
        console.error(`[Vehicle Controller] Enhanced lookup failed for ${registration}:`, result.error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'LOOKUP_FAILED',
            message: result.error || 'Failed to lookup vehicle data from all sources'
          }
        });
      }

      console.log(`[Vehicle Controller] Enhanced lookup successful for ${registration}`);
      console.log(`[Vehicle Controller] Data sources - DVLA: ${result.data.dataSources?.dvla}, CheckCarDetails: ${result.data.dataSources?.checkCarDetails}`);

      // Unwrap the data for frontend compatibility
      const unwrappedData = this.unwrapVehicleData(result.data);

      // Return unwrapped data for frontend
      return res.json({
        success: true,
        data: unwrappedData,
        warnings: result.warnings || [],
        dataSources: result.data.dataSources
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in enhancedVehicleLookup:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during vehicle lookup',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * Unwrap vehicle data from {value, source} format to plain values for frontend
   * @param {Object} wrappedData - Data with wrapped values
   * @returns {Object} Data with unwrapped values
   */
  unwrapVehicleData(wrappedData) {
    const unwrapped = {};
    
    // Helper function to extract value from wrapped format
    const getValue = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object' && field !== null && field.hasOwnProperty('value')) {
        return field.value;
      }
      return field;
    };
    
    // Recursively unwrap nested objects
    const unwrapObject = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) return obj; // Keep arrays as-is
      if (typeof obj !== 'object') return obj; // Keep primitives as-is
      
      // If it's a wrapped object with {value, source}, extract the value
      if (obj.hasOwnProperty('value')) {
        return obj.value;
      }
      
      // Otherwise, recursively unwrap nested objects
      const unwrappedObj = {};
      Object.entries(obj).forEach(([key, value]) => {
        unwrappedObj[key] = unwrapObject(value);
      });
      return unwrappedObj;
    };
    
    // Unwrap all fields
    Object.entries(wrappedData).forEach(([key, value]) => {
      if (key === 'dataSources' || key === 'fieldSources') {
        // Keep metadata objects as-is
        unwrapped[key] = value;
      } else if (key === 'valuation' && typeof value === 'object' && value !== null && !value.hasOwnProperty('value')) {
        // Keep valuation object as-is if it's already unwrapped, but fix empty estimatedValue
        const fixedValuation = { ...value };
        
        // CRITICAL FIX: Handle empty estimatedValue in valuation object
        if (fixedValuation.estimatedValue && 
            typeof fixedValuation.estimatedValue === 'object' && 
            Object.keys(fixedValuation.estimatedValue).length === 0) {
          
          console.log(`[Vehicle Controller] Fixing empty estimatedValue for valuation`);
          
          // Try to reconstruct from other sources in the wrapped data
          if (wrappedData.allValuations && Object.keys(wrappedData.allValuations).length > 0) {
            fixedValuation.estimatedValue = wrappedData.allValuations;
            console.log(`[Vehicle Controller] Reconstructed estimatedValue from allValuations:`, fixedValuation.estimatedValue);
          } else {
            // Try to find price data elsewhere in the wrapped data
            const privatePrice = wrappedData.privatePrice || wrappedData.price;
            if (privatePrice && privatePrice > 0) {
              fixedValuation.estimatedValue = {
                private: privatePrice,
                retail: Math.round(privatePrice * 1.15), // Estimate retail as 15% higher
                trade: Math.round(privatePrice * 0.85)   // Estimate trade as 15% lower
              };
              console.log(`[Vehicle Controller] Reconstructed estimatedValue from price:`, fixedValuation.estimatedValue);
            } else {
              console.log(`[Vehicle Controller] Could not reconstruct estimatedValue - no price data available`);
            }
          }
        }
        
        unwrapped[key] = fixedValuation;
        console.log(`[Vehicle Controller] Keeping valuation object as-is:`, fixedValuation);
      } else if (Array.isArray(value)) {
        // Keep arrays as-is (motHistory, mileageHistory)
        unwrapped[key] = value;
      } else {
        // Recursively unwrap all other fields
        unwrapped[key] = unwrapObject(value);
      }
    });
    
    console.log(`[Vehicle Controller] Unwrapped ${Object.keys(wrappedData).length} fields for frontend`);
    console.log(`[Vehicle Controller] Sample unwrapped fields:`, {
      make: unwrapped.make,
      model: unwrapped.model,
      bodyType: unwrapped.bodyType
    });
    console.log('🏃 [Vehicle Controller] Unwrapped runningCosts:', JSON.stringify(unwrapped.runningCosts, null, 2));
    
    // CRITICAL FIX: Final check for price data - ensure we have some price available
    if (!unwrapped.valuation || !unwrapped.valuation.estimatedValue || 
        Object.keys(unwrapped.valuation.estimatedValue).length === 0) {
      
      // Try to find any price data in the unwrapped data
      const availablePrice = unwrapped.price || unwrapped.estimatedValue || unwrapped.privatePrice;
      
      if (availablePrice && availablePrice > 0) {
        console.log(`[Vehicle Controller] Creating valuation from available price: £${availablePrice}`);
        
        if (!unwrapped.valuation) {
          unwrapped.valuation = {};
        }
        
        unwrapped.valuation.estimatedValue = {
          private: availablePrice,
          retail: Math.round(availablePrice * 1.15),
          trade: Math.round(availablePrice * 0.85)
        };
        
        unwrapped.valuation.confidence = 'medium';
        unwrapped.valuation.source = 'reconstructed';
        
        console.log(`[Vehicle Controller] Created valuation object:`, unwrapped.valuation);
      } else {
        console.log(`[Vehicle Controller] No price data available to create valuation`);
      }
    }
    
    // CRITICAL FIX: Extract private sale value as the main price field for frontend
    if (unwrapped.valuation && unwrapped.valuation.estimatedValue) {
      const privateSaleValue = unwrapped.valuation.estimatedValue.private;
      if (privateSaleValue && typeof privateSaleValue === 'number' && privateSaleValue > 0) {
        unwrapped.price = privateSaleValue;
        console.log(`[Vehicle Controller] Set price field to private sale value: £${privateSaleValue}`);
      } else {
        console.log(`[Vehicle Controller] No valid private sale value found:`, unwrapped.valuation.estimatedValue);
      }
    } else {
      console.log(`[Vehicle Controller] No valuation data available for price extraction`);
    }
    
    return unwrapped;
  }

  /**
   * GET /api/vehicles/my-listings
   * Get all listings for the authenticated user
   * If user is admin, returns ALL listings from all users
   */
  async getMyListings(req, res, next) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        console.log('[Vehicle Controller] Unauthenticated request to my-listings');
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user._id || req.user.id;
      const isAdmin = req.user.isAdmin || req.user.role === 'admin';
      
      console.log('[Vehicle Controller] Fetching listings for user:', userId);
      console.log('[Vehicle Controller] Is Admin:', isAdmin);
      console.log('[Vehicle Controller] User object:', req.user);

      // Import Bike model
      const Bike = require('../models/Bike');

      // If admin, get ALL listings. Otherwise, get only user's listings
      const query = isAdmin ? {} : { userId: userId };
      
      // Find vehicles (cars and bikes)
      // CRITICAL FIX: Use .lean() to get Mixed type fields like businessLogo/businessWebsite
      const [cars, bikes] = await Promise.all([
        Car.find(query).lean().populate('userId', 'email name').sort({ createdAt: -1 }),
        Bike.find(query).lean().populate('userId', 'email name').sort({ createdAt: -1 })
      ]);

      console.log('[Vehicle Controller] Found', cars.length, 'cars and', bikes.length, 'bikes');
      if (isAdmin) {
        console.log('[Vehicle Controller] Admin view: Showing ALL listings from all users');
      } else {
        console.log('[Vehicle Controller] User view: Showing only listings for user:', userId);
      }

      // Combine and mark vehicle types
      // CRITICAL FIX: Since we used .lean(), cars and bikes are already plain objects
      const allListings = [
        ...cars.map(car => ({ 
          ...car, // Already a plain object from .lean()
          vehicleType: 'car',
          ownerEmail: car.userId?.email || 'Unknown',
          ownerName: car.userId?.name || 'Unknown'
        })),
        ...bikes.map(bike => ({ 
          ...bike, // Already a plain object from .lean()
          vehicleType: 'bike',
          advertStatus: bike.status, // Map bike.status to advertStatus for frontend consistency
          ownerEmail: bike.userId?.email || 'Unknown',
          ownerName: bike.userId?.name || 'Unknown'
        }))
      ];

      // Sort by creation date (newest first)
      allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // If no listings found, return empty array (not an error)
      if (allListings.length === 0) {
        return res.json({
          success: true,
          listings: [],
          count: 0,
          message: 'No listings found'
        });
      }

      // Clean up "null" strings in all listings
      const cleanedListings = allListings.map(listing => {
        return this.cleanNullStrings(listing);
      });

      return res.json({
        success: true,
        listings: cleanedListings,
        count: cleanedListings.length,
        isAdmin: isAdmin // Let frontend know if this is admin view
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in getMyListings:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch listings'
      });
    }
  }

  /**
   * PATCH /api/vehicles/:id/status
   * Update vehicle status (mark as sold, etc.)
   */
  async updateVehicleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { advertStatus } = req.body;

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user._id || req.user.id;

      // Import Bike model
      const Bike = require('../models/Bike');

      // Try to find the vehicle in both Car and Bike collections
      let vehicle = await Car.findById(id);
      let vehicleType = 'car';
      
      if (!vehicle) {
        vehicle = await Bike.findById(id);
        vehicleType = 'bike';
      }

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Check if user owns this vehicle
      if (vehicle.userId && vehicle.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this vehicle'
        });
      }

      // Update status (bikes use 'status', cars use 'advertStatus')
      if (vehicleType === 'bike') {
        vehicle.status = advertStatus;
      } else {
        vehicle.advertStatus = advertStatus;
      }
      
      if (advertStatus === 'sold') {
        vehicle.soldAt = new Date();
      }
      await vehicle.save();

      console.log('[Vehicle Controller] Updated', vehicleType, 'status:', id, advertStatus);

      return res.json({
        success: true,
        message: 'Vehicle status updated successfully',
        vehicle: this.cleanNullStrings(vehicle.toObject())
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in updateVehicleStatus:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update vehicle status'
      });
    }
  }

  /**
   * DELETE /api/vehicles/:id
   * Delete a vehicle listing
   */
  async deleteVehicle(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user._id || req.user.id;

      // Import Bike model
      const Bike = require('../models/Bike');

      // Try to find the vehicle in both Car and Bike collections
      let vehicle = await Car.findById(id);
      let vehicleType = 'car';
      
      if (!vehicle) {
        vehicle = await Bike.findById(id);
        vehicleType = 'bike';
      }

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Check if user owns this vehicle
      if (vehicle.userId && vehicle.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this vehicle'
        });
      }

      // Delete the vehicle from the appropriate collection
      if (vehicleType === 'bike') {
        await Bike.findByIdAndDelete(id);
      } else {
        await Car.findByIdAndDelete(id);
      }

      console.log('[Vehicle Controller] Deleted', vehicleType, ':', id);

      console.log('[Vehicle Controller] Deleted vehicle:', id);

      return res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });

    } catch (error) {
      console.error('[Vehicle Controller] Error in deleteVehicle:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete vehicle'
      });
    }
  }
}

module.exports = new VehicleController();
