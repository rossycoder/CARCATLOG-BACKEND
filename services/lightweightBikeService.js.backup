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
    
    console.log(`❌ CACHE MISS for ${registration} - Trying FREE DVLA API first`);
    
    try {
      // STEP 1: Try FREE DVLA API first (£0.00)
      let vehicleData = null;
      let apiCost = 0;
      let apiCalls = 0;
      let apiProvider = 'dvla';
      
      try {
        console.log(`🆓 Trying FREE DVLA API for ${registration}`);
        vehicleData = await dvlaService.lookupVehicle(registration);
        console.log(`✅ DVLA API success for ${registration} - FREE data obtained`);
        apiCost = 0;
        apiCalls = 1;
        apiProvider = 'dvla-free';
      } catch (dvlaError) {
        console.log(`❌ DVLA API failed for ${registration}: ${dvlaError.message}`);
        console.log(`🔄 Falling back to CheckCarDetails Vehiclespecs API (£0.05)`);
        
        // STEP 2: Fallback to CheckCarDetails Vehiclespecs API (£0.05)
        try {
          vehicleData = await CheckCarDetailsClient.getVehicleSpecs(registration);
          apiCost = 0.05;
          apiCalls = 1;
          apiProvider = 'vehiclespecs-fallback';
          console.log(`✅ CheckCarDetails Vehiclespecs API success for ${registration}`);
        } catch (checkCarError) {
          console.error(`❌ Both DVLA and CheckCarDetails APIs failed for ${registration}`);
          throw new Error(`Bike lookup failed: DVLA (${dvlaError.message}), CheckCarDetails (${checkCarError.message})`);
        }
      }
      
      if (!vehicleData) {
        throw new Error('No bike data found from any API');
      }
      
      // Parse the response to get basic bike data
      let parsedData;
      if (apiProvider === 'dvla-free') {
        // Parse DVLA response
        parsedData = this.parseDVLAResponse(vehicleData, registration);
      } else {
        // Parse CheckCarDetails response
        parsedData = CheckCarDetailsClient.parseResponse(vehicleData);
      }
      
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
        engineCC: parsedData.engineCapacity || null,
        bikeType: this.determineBikeType(parsedData),
        bodyType: parsedData.bodyType || null,
        emissionClass: parsedData.emissionClass || parsedData.euroStatus ? `Euro ${parsedData.euroStatus}` : null,
        co2Emissions: parsedData.co2Emissions || null,
        
        // Add running costs if available from API (usually only from CheckCarDetails)
        combinedMpg: parsedData.combinedMpg || parsedData.fuelEconomyCombined || null,
        annualTax: parsedData.annualTax || parsedData.roadTax || null,
        insuranceGroup: parsedData.insuranceGroup || null,
        
        // Add estimated pricing based on bike age and type
        estimatedValue: this.calculateEstimatedPrice(parsedData),
        
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

      // Return basic bike data from cache (no history/MOT data)
      return {
        registration: cached.vrm,
        make: cached.make,
        model: cached.model,
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
        estimatedValue: this.calculateEstimatedPrice({
          make: cached.make,
          model: cached.model,
          year: cached.yearOfManufacture,
          fuelType: cached.fuelType,
          engineCapacity: cached.engineCapacity
        }),
        
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
}

module.exports = new LightweightBikeService();