/**
 * Lightweight Bike Service
 * Only fetches basic bike data for lookups - NO expensive API calls
 * Uses FREE DVLA API first, then falls back to cheap Vehiclespecs API (£0.05) if needed
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const VehicleHistory = require('../models/VehicleHistory');
const dvlaService = require('./dvlaService');

class LightweightBikeService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get basic bike data for lookups - NO expensive APIs
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage
   * @returns {Promise<Object>} Basic bike data only
   */
  async getBasicBikeData(registration, mileage) {
    console.log(`🏍️ Bike lookup for: ${registration} (basic data only)`);
    
    // Check cache first
    const cachedData = await this.checkCacheForBasicData(registration);
    if (cachedData) {
      console.log(`✅ CACHE HIT for ${registration} - Using cached basic data`);
      return {
        success: true,
        data: cachedData,
        fromCache: true,
        apiCalls: 0,
        cost: 0
      };
    }
    
    console.log(`❌ CACHE MISS for ${registration} - Fetching from API`);
    
    try {
      // STEP 1: Try CheckCarDetails API FIRST (£0.05) - has complete bike data
      let vehicleData = null;
      let apiCost = 0;
      let apiCalls = 0;
      let apiProvider = 'checkcardetails';
      let dvlaColor = null;
      
      try {
        console.log(`💰 Calling CheckCarDetails API for ${registration} (£0.05)`);
        const client = new CheckCarDetailsClient();
        vehicleData = await client.getVehicleSpecs(registration);
        apiCost = 0.05;
        apiCalls = 1;
        apiProvider = 'checkcardetails-primary';
        console.log(`✅ CheckCarDetails Vehiclespecs API success for ${registration}`);
        
        // CRITICAL: Log raw API response to see what data we're getting
        console.log(`📋 RAW API Response for ${registration}:`, JSON.stringify({
          hasResponse: !!vehicleData?.Response,
          hasDataItems: !!vehicleData?.Response?.DataItems,
          VehicleRegistration: vehicleData?.Response?.DataItems?.VehicleRegistration,
          ModelData: vehicleData?.Response?.DataItems?.ModelData,
          SmmtDetails: vehicleData?.Response?.DataItems?.SmmtDetails,
          hasModel: !!vehicleData?.Response?.DataItems?.ModelData?.Model,
          model: vehicleData?.Response?.DataItems?.ModelData?.Model,
          modelVariant: vehicleData?.Response?.DataItems?.ModelData?.ModelVariant
        }, null, 2));
        
        // CRITICAL: For bikes, CheckCarDetails might return data in VehicleRegistration instead of ModelData
        const dataItems = vehicleData?.Response?.DataItems || {};
        const vehicleReg = dataItems.VehicleRegistration || {};
        const modelData = dataItems.ModelData || {};
        const smmtDetails = dataItems.SmmtDetails || {};
        
        console.log(`🔍 Bike-specific fields:`, {
          'VehicleRegistration.Make': vehicleReg.Make,
          'VehicleRegistration.Model': vehicleReg.Model,
          'VehicleRegistration.MakeModel': vehicleReg.MakeModel,
          'ModelData.Make': modelData.Make,
          'ModelData.Model': modelData.Model,
          'SmmtDetails.Marque': smmtDetails.Marque,
          'SmmtDetails.ModelVariant': smmtDetails.ModelVariant
        });
        
        // Parse CheckCarDetails response
        const ApiResponseParser = require('../utils/apiResponseParser');
        const parsedCheckCarData = ApiResponseParser.parseCheckCarDetailsResponse(vehicleData);
        
        console.log(`🔍 PARSED Data:`, {
          make: parsedCheckCarData.make,
          model: parsedCheckCarData.model,
          variant: parsedCheckCarData.variant,
          year: parsedCheckCarData.year
        });
        
        // STEP 2: If CheckCarDetails is missing color, try FREE DVLA API for color
        if (!parsedCheckCarData.color || parsedCheckCarData.color === 'Not specified') {
          try {
            console.log(`🎨 CheckCarDetails missing color, trying FREE DVLA API for color`);
            const dvlaData = await dvlaService.lookupVehicle(registration);
            dvlaColor = dvlaData.colour || null;
            
            if (dvlaColor) {
              parsedCheckCarData.color = dvlaColor;
              console.log(`✅ Using DVLA color: ${dvlaColor}`);
            }
          } catch (dvlaError) {
            console.log(`⚠️ DVLA API failed for color: ${dvlaError.message}`);
            // Continue without DVLA color - not critical
          }
        }
        
        vehicleData = parsedCheckCarData;
        
      } catch (checkCarError) {
        console.log(`❌ CheckCarDetails API failed for ${registration}: ${checkCarError.message}`);
        console.log(`🔄 Falling back to FREE DVLA API`);
        
        // STEP 3: Fallback to FREE DVLA API if CheckCarDetails fails
        try {
          console.log(`🆓 Trying FREE DVLA API for ${registration}`);
          const dvlaData = await dvlaService.lookupVehicle(registration);
          
          // Check if DVLA has complete data
          if (!dvlaData.model || dvlaData.model === null) {
            throw new Error('DVLA API returned incomplete data (missing model)');
          }
          
          vehicleData = dvlaData;
          console.log(`✅ DVLA API success for ${registration} - FREE data obtained`);
          apiCost = 0;
          apiCalls = 1;
          apiProvider = 'dvla-fallback';
        } catch (dvlaError) {
          console.error(`❌ Both CheckCarDetails and DVLA APIs failed for ${registration}`);
          throw new Error(`Bike lookup failed: CheckCarDetails (${checkCarError.message}), DVLA (${dvlaError.message})`);
        }
      }
      
      if (!vehicleData) {
        throw new Error('No bike data found from any API');
      }
      
      // Parse the response to get basic bike data
      const ApiResponseParser = require('../utils/apiResponseParser');
      let parsedData;
      if (apiProvider === 'dvla-fallback') {
        // Parse DVLA response
        parsedData = this.parseDVLAResponse(vehicleData, registration);
      } else {
        // Already parsed CheckCarDetails data
        parsedData = vehicleData;
      }
      
      // Calculate estimated price
      const estimatedPrice = this.calculateEstimatedPrice(parsedData);
      
      // Format basic bike data (no history/MOT data)
      const basicData = {
        registration: registration,
        mileage: mileage,
        make: parsedData.make || null,
        model: parsedData.model || null,
        variant: parsedData.variant || parsedData.modelVariant || null,
        year: parsedData.year || null,
        color: parsedData.color || null,
        fuelType: parsedData.fuelType || 'Petrol',
        transmission: 'Manual', // Most bikes are manual
        engineSize: parsedData.engineSize ? `${parseFloat(parsedData.engineSize).toFixed(1)}L` : null,
        // Convert engineSize to engineCC if engineCapacity is not available
        engineCC: parsedData.engineCapacity || (parsedData.engineSize ? Math.round(parseFloat(parsedData.engineSize) * 1000) : null),
        bikeType: this.determineBikeType(parsedData),
        bodyType: parsedData.bodyType || null,
        emissionClass: parsedData.emissionClass || parsedData.euroStatus ? `Euro ${parsedData.euroStatus}` : null,
        co2Emissions: parsedData.co2Emissions || null,
        
        // Add running costs if available from API (usually only from CheckCarDetails)
        combinedMpg: parsedData.combinedMpg || parsedData.fuelEconomyCombined || null,
        annualTax: parsedData.annualTax || parsedData.roadTax || null,
        insuranceGroup: parsedData.insuranceGroup || null,
        
        // Add estimated pricing based on bike age and type
        estimatedValue: estimatedPrice,
        
        // CRITICAL: Add valuation structure (like cars) for frontend compatibility
        valuation: {
          private: estimatedPrice,
          retail: Math.round(estimatedPrice * 1.15), // Retail ~15% higher
          trade: Math.round(estimatedPrice * 0.75), // Trade ~25% lower
          partExchange: Math.round(estimatedPrice * 0.80) // Part exchange ~20% lower
        },
        
        // Alternative valuation structure (for compatibility)
        allValuations: {
          private: estimatedPrice,
          retail: Math.round(estimatedPrice * 1.15),
          trade: Math.round(estimatedPrice * 0.75)
        },
        
        // NO vehicle history, MOT history, or detailed valuation data
        // These will be fetched later when bike is actually saved
        
        // Metadata
        apiProvider: apiProvider,
        checkDate: new Date(),
        fromCache: false
      };
      
      // Cache the basic data for future lookups
      await this.cacheBasicDataOnly(registration, basicData);
      
      console.log(`✅ Bike lookup successful for ${registration}`);
      console.log(`   API Provider: ${apiProvider}, Cost: £${apiCost}, Data: ${basicData.make} ${basicData.model}`);
      
      return {
        success: true,
        data: basicData,
        fromCache: false,
        apiCalls: apiCalls,
        cost: apiCost
      };
      
    } catch (error) {
      console.error(`❌ Bike lookup failed for ${registration}:`, error.message);
      
      return {
        success: false,
        error: `Bike lookup failed: ${error.message}. Please check the registration number and try again.`,
        data: null,
        fromCache: false,
        apiCalls: 1,
        cost: 0 // No cost if both APIs failed
      };
    }
  }

  /**
   * Check cache for basic bike data only
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} Cached basic data or null
   */
  async checkCacheForBasicData(registration) {
    try {
      const cached = await VehicleHistory.findOne({
        vrm: registration.toUpperCase().replace(/\s/g, '')
      });

      if (!cached) {
        return null;
      }

      // Check if cache is still valid (within TTL - 30 days)
      const cacheAge = Date.now() - new Date(cached.checkDate).getTime();
      if (cacheAge > this.cacheTTL) {
        console.log(`Cache expired for ${registration} (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
        return null;
      }

      // Calculate estimated price for cached data
      const cachedEstimatedPrice = this.calculateEstimatedPrice({
        make: cached.make,
        model: cached.model,
        year: cached.yearOfManufacture,
        fuelType: cached.fuelType,
        engineCapacity: cached.engineCapacity
      });
      
      // Return basic bike data from cache (no history/MOT data)
      return {
        registration: cached.vrm,
        make: cached.make || 'Unknown',
        model: cached.model || 'Unknown',
        variant: cached.variant,
        year: cached.yearOfManufacture,
        color: cached.colour,
        fuelType: cached.fuelType || 'Petrol',
        transmission: 'Manual',
        engineSize: cached.engineCapacity ? 
          (cached.engineCapacity > 10 ? `${(cached.engineCapacity / 1000).toFixed(1)}L` : `${parseFloat(cached.engineCapacity).toFixed(1)}L`) 
          : null,
        engineCC: cached.engineCapacity,
        bikeType: this.determineBikeType({ bodyType: cached.bodyType, engineCapacity: cached.engineCapacity }),
        bodyType: cached.bodyType,
        emissionClass: cached.emissionClass,
        co2Emissions: cached.co2Emissions,
        
        // Add running costs from cache if available
        combinedMpg: cached.combinedMpg || null,
        annualTax: cached.annualTax || null,
        insuranceGroup: cached.insuranceGroup || null,
        
        // Add estimated pricing for cached data too
        estimatedValue: cachedEstimatedPrice,
        
        // CRITICAL: Add valuation structure (like cars) for frontend compatibility
        valuation: {
          private: cachedEstimatedPrice,
          retail: Math.round(cachedEstimatedPrice * 1.15),
          trade: Math.round(cachedEstimatedPrice * 0.75),
          partExchange: Math.round(cachedEstimatedPrice * 0.80)
        },
        
        // Alternative valuation structure (for compatibility)
        allValuations: {
          private: cachedEstimatedPrice,
          retail: Math.round(cachedEstimatedPrice * 1.15),
          trade: Math.round(cachedEstimatedPrice * 0.75)
        },
        
        // Metadata
        apiProvider: cached.apiProvider || 'cached',
        checkDate: cached.checkDate,
        fromCache: true
      };
      
    } catch (error) {
      console.error(`Cache check error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Cache basic bike data only (no expensive history/MOT data)
   * @param {string} registration - Vehicle registration number
   * @param {Object} basicData - Basic bike data
   * @returns {Promise<Object>} Saved VehicleHistory document
   */
  async cacheBasicDataOnly(registration, basicData) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      
      // Check if record already exists
      const existing = await VehicleHistory.findOne({ vrm: cleanedReg });
      
      if (existing) {
        // Update existing record with basic data only (don't overwrite history/MOT data if it exists)
        existing.make = basicData.make || existing.make;
        existing.model = basicData.model || existing.model;
        existing.variant = basicData.variant || existing.variant;
        existing.yearOfManufacture = basicData.year || existing.yearOfManufacture;
        existing.colour = basicData.color || existing.colour;
        existing.fuelType = basicData.fuelType || existing.fuelType;
        existing.transmission = basicData.transmission || existing.transmission;
        existing.engineCapacity = basicData.engineCC || (basicData.engineSize ? parseFloat(basicData.engineSize) * 1000 : existing.engineCapacity);
        existing.bodyType = basicData.bodyType || existing.bodyType;
        existing.emissionClass = basicData.emissionClass || existing.emissionClass;
        existing.co2Emissions = basicData.co2Emissions || existing.co2Emissions;
        
        // Update running costs if available
        existing.combinedMpg = basicData.combinedMpg || existing.combinedMpg;
        existing.annualTax = basicData.annualTax || existing.annualTax;
        existing.insuranceGroup = basicData.insuranceGroup || existing.insuranceGroup;
        
        existing.checkDate = new Date();
        
        await existing.save();
        console.log(`✅ Updated existing cache for ${registration} (basic bike data only)`);
        return existing;
      } else {
        // Create new record with basic data only
        const cacheData = {
          vrm: cleanedReg,
          make: basicData.make,
          model: basicData.model,
          variant: basicData.variant,
          yearOfManufacture: basicData.year,
          colour: basicData.color,
          fuelType: basicData.fuelType,
          transmission: basicData.transmission,
          engineCapacity: basicData.engineCC || (basicData.engineSize ? parseFloat(basicData.engineSize) * 1000 : null),
          bodyType: basicData.bodyType,
          emissionClass: basicData.emissionClass,
          co2Emissions: basicData.co2Emissions,
          
          // Add running costs
          combinedMpg: basicData.combinedMpg,
          annualTax: basicData.annualTax,
          insuranceGroup: basicData.insuranceGroup,
          
          // Default values for other fields (no expensive data)
          numberOfPreviousKeepers: 0,
          previousOwners: 0,
          v5cCertificateCount: 0,
          plateChanges: 0,
          colourChanges: 0,
          vicCount: 0,
          hasAccidentHistory: false,
          isStolen: false,
          isWrittenOff: false,
          isScrapped: false,
          isImported: false,
          isExported: false,
          hasOutstandingFinance: false,
          writeOffCategory: 'none',
          writeOffDetails: { category: 'none' },
          motHistory: [], // Empty - will be filled when bike is saved
          
          checkDate: new Date(),
          checkStatus: 'partial', // Changed from 'basic-only' to valid enum value
          apiProvider: 'vehiclespecs-only',
          testMode: process.env.API_ENVIRONMENT !== 'production'
        };
        
        const savedHistory = new VehicleHistory(cacheData);
        await savedHistory.save();
        
        console.log(`✅ Created new cache for ${registration} with ID: ${savedHistory._id} (basic bike data only)`);
        return savedHistory;
      }
      
    } catch (error) {
      console.error(`❌ Cache storage error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Determine bike type based on vehicle data
   * @param {Object} vehicleData - Basic vehicle data
   * @returns {string} Bike type
   */
  determineBikeType(vehicleData) {
    const engineCC = vehicleData.engineCapacity || 0;
    const bodyType = (vehicleData.bodyType || '').toLowerCase();
    
    // Determine bike type based on engine size and body type
    if (bodyType.includes('scooter') || engineCC <= 125) {
      return 'Scooter';
    } else if (bodyType.includes('sport') || bodyType.includes('super')) {
      return 'Sports';
    } else if (bodyType.includes('touring') || bodyType.includes('adventure')) {
      return 'Touring';
    } else if (bodyType.includes('cruiser') || bodyType.includes('chopper')) {
      return 'Cruiser';
    } else if (bodyType.includes('naked') || bodyType.includes('standard')) {
      return 'Naked';
    } else if (bodyType.includes('off') || bodyType.includes('dirt') || bodyType.includes('enduro')) {
      return 'Off Road';
    } else if (engineCC >= 600) {
      return 'Sports';
    } else if (engineCC >= 250) {
      return 'Standard';
    } else {
      return 'Other';
    }
  }

  /**
   * Calculate estimated price based on bike data
   * @param {Object} vehicleData - Basic bike data
   * @returns {number} Estimated price in GBP
   */
  calculateEstimatedPrice(vehicleData) {
    try {
      const currentYear = new Date().getFullYear();
      const vehicleYear = parseInt(vehicleData.year) || currentYear;
      const vehicleAge = Math.max(0, currentYear - vehicleYear);
      const engineCC = vehicleData.engineCapacity || 600;
      
      // Base prices by make (rough estimates for bikes)
      const basePrices = {
        'HONDA': 8000,
        'YAMAHA': 8500,
        'SUZUKI': 7500,
        'KAWASAKI': 8000,
        'BMW': 15000,
        'DUCATI': 12000,
        'TRIUMPH': 10000,
        'HARLEY-DAVIDSON': 18000,
        'KTM': 9000,
        'APRILIA': 10000,
        'MV AGUSTA': 15000,
        'MOTO GUZZI': 8000,
        'INDIAN': 16000,
        'ROYAL ENFIELD': 4000,
        'BENELLI': 5000,
        'HYOSUNG': 4000
      };
      
      const make = (vehicleData.make || '').toUpperCase();
      let basePrice = basePrices[make] || 6000; // Default £6,000
      
      // Adjust for engine size
      if (engineCC <= 125) {
        basePrice = Math.min(basePrice, 3000); // Small bikes max £3,000
      } else if (engineCC <= 250) {
        basePrice = Math.min(basePrice, 5000); // Small-medium bikes max £5,000
      } else if (engineCC <= 600) {
        basePrice = basePrice * 0.8; // Medium bikes
      } else if (engineCC >= 1000) {
        basePrice = basePrice * 1.3; // Large bikes
      }
      
      // Adjust for vehicle age (depreciation)
      const depreciationRate = 0.18; // 18% per year (bikes depreciate faster than cars)
      const depreciatedPrice = basePrice * Math.pow(1 - depreciationRate, vehicleAge);
      
      // Calculate final estimated price
      let estimatedPrice = depreciatedPrice;
      
      // Apply reasonable bounds
      estimatedPrice = Math.max(500, Math.min(50000, estimatedPrice));
      
      // Round to nearest £250
      estimatedPrice = Math.round(estimatedPrice / 250) * 250;
      
      console.log(`🏍️ Estimated price for ${make} ${vehicleData.model} (${vehicleYear}, ${engineCC}cc): £${estimatedPrice}`);
      
      return estimatedPrice;
      
    } catch (error) {
      console.error('Error calculating estimated bike price:', error.message);
      return 3000; // Default £3,000
    }
  }

  /**
   * Parse DVLA API response to extract bike data
   * @param {Object} dvlaResponse - Raw DVLA API response
   * @param {string} registration - Vehicle registration number
   * @returns {Object} Parsed bike data
   */
  parseDVLAResponse(dvlaResponse, registration) {
    try {
      console.log(`🔍 Parsing DVLA response for bike ${registration}`);
      
      // DVLA API response structure
      const parsed = {
        registration: registration,
        make: dvlaResponse.make || null,
        model: dvlaResponse.model || null,
        variant: null, // DVLA doesn't provide variant
        year: dvlaResponse.yearOfManufacture || null,
        color: dvlaResponse.colour || null,
        fuelType: dvlaResponse.fuelType || 'Petrol',
        transmission: 'Manual', // Most bikes are manual
        engineSize: dvlaResponse.engineCapacity ? (dvlaResponse.engineCapacity / 1000).toFixed(1) : null,
        engineCapacity: dvlaResponse.engineCapacity || null,
        bodyType: dvlaResponse.typeApproval || null,
        emissionClass: dvlaResponse.euroStatus ? `Euro ${dvlaResponse.euroStatus}` : null,
        co2Emissions: dvlaResponse.co2Emissions || null,
        
        // DVLA doesn't provide running costs data
        combinedMpg: null,
        annualTax: dvlaResponse.taxStatus === 'Taxed' ? null : null, // DVLA doesn't provide tax amount
        insuranceGroup: null,
        
        // Additional DVLA fields
        taxStatus: dvlaResponse.taxStatus || null,
        taxDueDate: dvlaResponse.taxDueDate || null,
        motStatus: dvlaResponse.motStatus || null,
        motExpiryDate: dvlaResponse.motExpiryDate || null,
        
        // Metadata
        apiProvider: 'dvla-free'
      };
      
      console.log(`✅ DVLA bike data parsed: ${parsed.make} ${parsed.model} (${parsed.year})`);
      return parsed;
      
    } catch (error) {
      console.error(`❌ Error parsing DVLA response for bike ${registration}:`, error.message);
      throw new Error(`Failed to parse DVLA response: ${error.message}`);
    }
  }

  /**
   * Get COMPLETE bike data including MOT, History, and Valuation
   * This is used in the edit page to fetch all data after basic lookup
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage
   * @returns {Promise<Object>} Complete bike data with MOT, History, Valuation
   */
  async getCompleteBikeData(registration, mileage) {
    console.log(`🏍️ [Complete Data] Fetching ALL data for: ${registration}`);
    
    const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
    const parsedMileage = mileage ? parseInt(mileage, 10) : 50000;
    
    try {
      const client = new CheckCarDetailsClient();
      const MOTHistoryService = require('./motHistoryService');
      const HistoryService = require('./historyService');
      const ValuationService = require('./valuationService');
      
      // Instantiate services
      const motService = new MOTHistoryService();
      const historyService = new HistoryService();
      const valuationService = new ValuationService();
      
      // Fetch all APIs in parallel
      console.log(`📡 [Complete Data] Calling 4 APIs: Specs, MOT, History, Valuation`);
      
      const [specsResult, motResult, historyResult, valuationResult] = await Promise.allSettled([
        client.getVehicleSpecs(cleanedReg),
        motService.fetchAndSaveMOTHistory(cleanedReg, false),
        historyService.checkVehicleHistory(cleanedReg),
        valuationService.getValuation(cleanedReg, parsedMileage)
      ]);
      
      // Parse specs data
      let bikeData = {};
      if (specsResult.status === 'fulfilled') {
        const ApiResponseParser = require('../utils/apiResponseParser');
        bikeData = ApiResponseParser.parseCheckCarDetailsResponse(specsResult.value);
        console.log(`✅ [Complete Data] Specs API success`);
      } else {
        console.log(`❌ [Complete Data] Specs API failed:`, specsResult.reason?.message);
      }
      
      // Add MOT data
      if (motResult.status === 'fulfilled' && motResult.value) {
        console.log(`🔍 [Complete Data] MOT Result:`, {
          success: motResult.value.success,
          dataType: typeof motResult.value.data,
          dataIsArray: Array.isArray(motResult.value.data),
          dataLength: motResult.value.data?.length,
          source: motResult.value.source
        });
        
        // MOTHistoryService returns { success, data: [...], source }
        const motData = motResult.value.data || [];
        bikeData.motHistory = motData;
        
        // Get latest MOT test for expiry date
        if (Array.isArray(motData) && motData.length > 0) {
          const latestTest = motData[0];
          bikeData.motDue = latestTest.expiryDate || null;
          bikeData.motExpiry = latestTest.expiryDate || null;
          bikeData.motStatus = latestTest.testResult === 'PASSED' ? 'Valid' : 'Failed';
          
          console.log(`✅ [Complete Data] MOT API success - ${motData.length} tests found`);
          console.log(`   Latest test:`, {
            testDate: latestTest.testDate || latestTest.completedDate,
            expiryDate: latestTest.expiryDate,
            testResult: latestTest.testResult,
            odometerValue: latestTest.odometerValue
          });
          console.log(`   MOT Due: ${bikeData.motDue ? new Date(bikeData.motDue).toLocaleDateString() : 'Not available'}`);
        } else {
          console.log(`⚠️ [Complete Data] MOT API returned but no tests found (data length: ${motData?.length || 0})`);
        }
      } else {
        console.log(`❌ [Complete Data] MOT API failed:`, motResult.reason?.message);
        bikeData.motHistory = [];
        bikeData.motDue = null;
      }
      
      // Add History data (previous owners)
      if (historyResult.status === 'fulfilled' && historyResult.value) {
        const historyData = historyResult.value;
        bikeData.previousOwners = historyData.previousKeepers || historyData.keeperChanges || null;
        bikeData.writeOffCategory = historyData.writeOffCategory || 'none';
        bikeData.isWrittenOff = historyData.isWrittenOff || historyData.scrapped || false;
        console.log(`✅ [Complete Data] History API success - ${bikeData.previousOwners} previous owners`);
      } else {
        console.log(`❌ [Complete Data] History API failed:`, historyResult.reason?.message);
        bikeData.previousOwners = null;
      }
      
      // Add Valuation data
      if (valuationResult.status === 'fulfilled' && valuationResult.value) {
        // The valuation service returns a parsed result with estimatedValue object
        const valuationData = valuationResult.value;
        bikeData.valuation = {
          private: valuationData.estimatedValue?.private || 0,
          retail: valuationData.estimatedValue?.retail || 0,
          trade: valuationData.estimatedValue?.trade || 0,
          partExchange: valuationData.estimatedValue?.trade || 0
        };
        bikeData.allValuations = bikeData.valuation; // Add alias for frontend compatibility
        bikeData.estimatedValue = valuationData.estimatedValue?.private || null;
        console.log(`✅ [Complete Data] Valuation API success - Private: £${bikeData.estimatedValue}`);
      } else {
        console.log(`❌ [Complete Data] Valuation API failed:`, valuationResult.reason?.message);
        // Generate fallback valuation
        const fallbackPrice = this.calculateEstimatedPrice({
          make: bikeData.make,
          model: bikeData.model,
          year: bikeData.year,
          fuelType: bikeData.fuelType,
          engineCapacity: bikeData.engineCC
        });
        bikeData.valuation = {
          private: fallbackPrice,
          retail: Math.round(fallbackPrice * 1.15),
          trade: Math.round(fallbackPrice * 0.75),
          partExchange: Math.round(fallbackPrice * 0.70)
        };
        bikeData.estimatedValue = fallbackPrice;
      }
      
      // Calculate API cost
      let apiCost = 0;
      let apiCalls = 0;
      
      if (specsResult.status === 'fulfilled') { apiCost += 0.05; apiCalls++; }
      if (motResult.status === 'fulfilled') { apiCost += 0.02; apiCalls++; }
      if (historyResult.status === 'fulfilled') { apiCost += 1.82; apiCalls++; }
      if (valuationResult.status === 'fulfilled') { apiCost += 0.12; apiCalls++; }
      
      console.log(`💰 [Complete Data] Total cost: £${apiCost.toFixed(2)} (${apiCalls} successful API calls)`);
      
      return {
        success: true,
        data: bikeData,
        fromCache: false,
        apiCalls,
        cost: apiCost
      };
      
    } catch (error) {
      console.error(`❌ [Complete Data] Error fetching complete bike data:`, error);
      return {
        success: false,
        error: error.message,
        data: null,
        apiCalls: 0,
        cost: 0
      };
    }
  }
}

module.exports = new LightweightBikeService();
