/**
 * Lightweight Van Service
 * Only fetches basic van data for lookups - NO expensive API calls
 * Uses FREE DVLA API first, then falls back to cheap Vehiclespecs API (£0.05) if needed
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const VehicleHistory = require('../models/VehicleHistory');
const dvlaService = require('./dvlaService');

class LightweightVanService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get basic van data for lookups - NO expensive APIs
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage
   * @returns {Promise<Object>} Basic van data only
   */
  async getBasicVanData(registration, mileage) {
    console.log(`🚐 Van lookup for: ${registration} (basic data only)`);
    
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
          throw new Error(`Van lookup failed: DVLA (${dvlaError.message}), CheckCarDetails (${checkCarError.message})`);
        }
      }
      
      if (!vehicleData) {
        throw new Error('No van data found from any API');
      }
      
      // Parse the response to get basic van data
      let parsedData;
      if (apiProvider === 'dvla-free') {
        // Parse DVLA response
        parsedData = this.parseDVLAResponse(vehicleData, registration);
      } else {
        // Parse CheckCarDetails response
        parsedData = CheckCarDetailsClient.parseResponse(vehicleData);
      }
      
      // Format basic van data (no history/MOT data)
      const basicData = {
        registration: registration,
        mileage: mileage,
        make: parsedData.make || null,
        model: parsedData.model || null,
        variant: parsedData.variant || parsedData.modelVariant || null,
        year: parsedData.year || null,
        color: parsedData.color || null,
        fuelType: parsedData.fuelType || 'Diesel',
        transmission: parsedData.transmission || 'Manual',
        engineSize: parsedData.engineSize ? `${parseFloat(parsedData.engineSize).toFixed(1)}L` : null,
        bodyType: parsedData.bodyType || null,
        vanType: this.determineVanType(parsedData),
        doors: parsedData.doors || null,
        seats: parsedData.seats || 2, // Most vans have 2-3 seats
        emissionClass: parsedData.emissionClass || parsedData.euroStatus ? `Euro ${parsedData.euroStatus}` : null,
        co2Emissions: parsedData.co2Emissions || null,
        
        // Van-specific fields (estimated)
        payloadCapacity: this.estimatePayloadCapacity(parsedData),
        loadLength: null, // Not available from basic APIs
        loadWidth: null,
        loadHeight: null,
        wheelbase: null,
        roofHeight: null,
        
        // Add running costs if available from API (usually only from CheckCarDetails)
        urbanMpg: parsedData.urbanMpg || parsedData.fuelEconomyUrban || null,
        extraUrbanMpg: parsedData.extraUrbanMpg || parsedData.fuelEconomyExtraUrban || null,
        combinedMpg: parsedData.combinedMpg || parsedData.fuelEconomyCombined || null,
        annualTax: parsedData.annualTax || parsedData.roadTax || null,
        insuranceGroup: parsedData.insuranceGroup || null,
        
        // Add estimated pricing based on van age and type
        estimatedValue: this.calculateEstimatedPrice(parsedData),
        
        // NO vehicle history, MOT history, or detailed valuation data
        // These will be fetched later when van is actually saved
        
        // Metadata
        apiProvider: apiProvider,
        checkDate: new Date(),
        fromCache: false
      };
      
      // Cache the basic data for future lookups
      await this.cacheBasicDataOnly(registration, basicData);
      
      console.log(`✅ Van lookup successful for ${registration}`);
      console.log(`   API Provider: ${apiProvider}, Cost: £${apiCost}, Data: ${basicData.make} ${basicData.model}`);
      
      return {
        success: true,
        data: basicData,
        fromCache: false,
        apiCalls: apiCalls,
        cost: apiCost
      };
      
    } catch (error) {
      console.error(`❌ Van lookup failed for ${registration}:`, error.message);
      
      return {
        success: false,
        error: `Van lookup failed: ${error.message}. Please check the registration number and try again.`,
        data: null,
        fromCache: false,
        apiCalls: 1,
        cost: 0 // No cost if both APIs failed
      };
    }
  }

  /**
   * Check cache for basic van data only
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

      // Return basic van data from cache (no history/MOT data)
      return {
        registration: cached.vrm,
        make: cached.make,
        model: cached.model,
        variant: cached.variant,
        year: cached.yearOfManufacture,
        color: cached.colour,
        fuelType: cached.fuelType || 'Diesel',
        transmission: cached.transmission || 'Manual',
        engineSize: cached.engineCapacity ? 
          (cached.engineCapacity > 10 ? `${(cached.engineCapacity / 1000).toFixed(1)}L` : `${parseFloat(cached.engineCapacity).toFixed(1)}L`) 
          : null,
        bodyType: cached.bodyType,
        vanType: this.determineVanType({ bodyType: cached.bodyType }),
        doors: cached.doors,
        seats: cached.seats || 2,
        emissionClass: cached.emissionClass,
        co2Emissions: cached.co2Emissions,
        
        // Van-specific fields
        payloadCapacity: this.estimatePayloadCapacity({ make: cached.make, model: cached.model }),
        loadLength: null,
        loadWidth: null,
        loadHeight: null,
        wheelbase: null,
        roofHeight: null,
        
        // Add running costs from cache if available
        urbanMpg: cached.urbanMpg || null,
        extraUrbanMpg: cached.extraUrbanMpg || null,
        combinedMpg: cached.combinedMpg || null,
        annualTax: cached.annualTax || null,
        insuranceGroup: cached.insuranceGroup || null,
        
        // Add estimated pricing for cached data too
        estimatedValue: this.calculateEstimatedPrice({
          make: cached.make,
          model: cached.model,
          year: cached.yearOfManufacture,
          fuelType: cached.fuelType,
          engineSize: cached.engineCapacity ? (cached.engineCapacity / 1000).toFixed(1) : null
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
   * Cache basic van data only (no expensive history/MOT data)
   * @param {string} registration - Vehicle registration number
   * @param {Object} basicData - Basic van data
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
        existing.engineCapacity = basicData.engineSize ? parseFloat(basicData.engineSize) * 1000 : existing.engineCapacity;
        existing.bodyType = basicData.bodyType || existing.bodyType;
        existing.doors = basicData.doors || existing.doors;
        existing.seats = basicData.seats || existing.seats;
        existing.emissionClass = basicData.emissionClass || existing.emissionClass;
        existing.co2Emissions = basicData.co2Emissions || existing.co2Emissions;
        
        // Update running costs if available
        existing.urbanMpg = basicData.urbanMpg || existing.urbanMpg;
        existing.extraUrbanMpg = basicData.extraUrbanMpg || existing.extraUrbanMpg;
        existing.combinedMpg = basicData.combinedMpg || existing.combinedMpg;
        existing.annualTax = basicData.annualTax || existing.annualTax;
        existing.insuranceGroup = basicData.insuranceGroup || existing.insuranceGroup;
        
        existing.checkDate = new Date();
        
        await existing.save();
        console.log(`✅ Updated existing cache for ${registration} (basic van data only)`);
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
          engineCapacity: basicData.engineSize ? parseFloat(basicData.engineSize) * 1000 : null,
          bodyType: basicData.bodyType,
          doors: basicData.doors,
          seats: basicData.seats,
          emissionClass: basicData.emissionClass,
          co2Emissions: basicData.co2Emissions,
          
          // Add running costs
          urbanMpg: basicData.urbanMpg,
          extraUrbanMpg: basicData.extraUrbanMpg,
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
          motHistory: [], // Empty - will be filled when van is saved
          
          checkDate: new Date(),
          checkStatus: 'partial', // Changed from 'basic-only' to valid enum value
          apiProvider: 'vehiclespecs-only',
          testMode: process.env.API_ENVIRONMENT !== 'production'
        };
        
        const savedHistory = new VehicleHistory(cacheData);
        await savedHistory.save();
        
        console.log(`✅ Created new cache for ${registration} with ID: ${savedHistory._id} (basic van data only)`);
        return savedHistory;
      }
      
    } catch (error) {
      console.error(`❌ Cache storage error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Determine van type based on vehicle data
   * @param {Object} vehicleData - Basic vehicle data
   * @returns {string} Van type
   */
  determineVanType(vehicleData) {
    const bodyType = (vehicleData.bodyType || '').toLowerCase();
    const make = (vehicleData.make || '').toLowerCase();
    const model = (vehicleData.model || '').toLowerCase();
    
    // Determine van type based on body type and model
    if (bodyType.includes('pickup') || model.includes('pickup') || model.includes('ranger') || model.includes('hilux')) {
      return 'Pickup';
    } else if (bodyType.includes('chassis') || model.includes('chassis')) {
      return 'Chassis Cab';
    } else if (bodyType.includes('tipper') || model.includes('tipper')) {
      return 'Tipper';
    } else if (bodyType.includes('dropside') || model.includes('dropside')) {
      return 'Dropside';
    } else if (bodyType.includes('crew') || model.includes('crew')) {
      return 'Crew Van';
    } else if (bodyType.includes('window') || model.includes('kombi') || model.includes('shuttle')) {
      return 'Window Van';
    } else if (bodyType.includes('refrigerat') || model.includes('fridge') || model.includes('freezer')) {
      return 'Refrigerated';
    } else if (bodyType.includes('luton') || model.includes('luton')) {
      return 'Luton';
    } else if (bodyType.includes('box') || model.includes('box')) {
      return 'Box Van';
    } else {
      return 'Panel Van'; // Default for most vans
    }
  }

  /**
   * Estimate payload capacity based on vehicle data
   * @param {Object} vehicleData - Basic vehicle data
   * @returns {number} Estimated payload capacity in kg
   */
  estimatePayloadCapacity(vehicleData) {
    const make = (vehicleData.make || '').toLowerCase();
    const model = (vehicleData.model || '').toLowerCase();
    
    // Rough estimates based on common van models
    if (model.includes('sprinter')) {
      return 1500; // Mercedes Sprinter
    } else if (model.includes('transit')) {
      return 1400; // Ford Transit
    } else if (model.includes('crafter')) {
      return 1500; // VW Crafter
    } else if (model.includes('master')) {
      return 1400; // Renault Master
    } else if (model.includes('ducato')) {
      return 1400; // Fiat Ducato
    } else if (model.includes('boxer')) {
      return 1400; // Peugeot Boxer
    } else if (model.includes('relay')) {
      return 1400; // Citroen Relay
    } else if (model.includes('vivaro') || model.includes('trafic') || model.includes('primastar')) {
      return 1200; // Medium vans
    } else if (model.includes('connect') || model.includes('combo') || model.includes('berlingo')) {
      return 800; // Small vans
    } else if (model.includes('pickup') || model.includes('ranger') || model.includes('hilux')) {
      return 1000; // Pickups
    } else {
      return 1000; // Default estimate
    }
  }

  /**
   * Calculate estimated price based on van data
   * @param {Object} vehicleData - Basic van data
   * @returns {number} Estimated price in GBP
   */
  calculateEstimatedPrice(vehicleData) {
    try {
      const currentYear = new Date().getFullYear();
      const vehicleYear = parseInt(vehicleData.year) || currentYear;
      const vehicleAge = Math.max(0, currentYear - vehicleYear);
      
      // Base prices by make (rough estimates for vans)
      const basePrices = {
        'MERCEDES': 35000,
        'FORD': 25000,
        'VOLKSWAGEN': 30000,
        'RENAULT': 22000,
        'FIAT': 20000,
        'PEUGEOT': 22000,
        'CITROEN': 20000,
        'IVECO': 25000,
        'MAN': 40000,
        'VAUXHALL': 20000,
        'NISSAN': 22000,
        'TOYOTA': 28000,
        'MITSUBISHI': 25000,
        'ISUZU': 30000
      };
      
      const make = (vehicleData.make || '').toUpperCase();
      const model = (vehicleData.model || '').toLowerCase();
      let basePrice = basePrices[make] || 20000; // Default £20,000
      
      // Adjust for van size/type
      if (model.includes('sprinter') || model.includes('crafter') || model.includes('master')) {
        basePrice = basePrice * 1.2; // Large vans
      } else if (model.includes('connect') || model.includes('combo') || model.includes('berlingo')) {
        basePrice = basePrice * 0.6; // Small vans
      } else if (model.includes('pickup') || model.includes('ranger') || model.includes('hilux')) {
        basePrice = basePrice * 0.8; // Pickups
      }
      
      // Adjust for vehicle age (depreciation)
      const depreciationRate = 0.16; // 16% per year (vans depreciate faster than cars but slower than bikes)
      const depreciatedPrice = basePrice * Math.pow(1 - depreciationRate, vehicleAge);
      
      // Adjust for fuel type
      let fuelMultiplier = 1.0;
      const fuelType = (vehicleData.fuelType || '').toLowerCase();
      if (fuelType.includes('electric')) {
        fuelMultiplier = 1.3; // Electric vans are premium
      } else if (fuelType.includes('hybrid')) {
        fuelMultiplier = 1.1; // Hybrids slightly better
      }
      
      // Calculate final estimated price
      let estimatedPrice = depreciatedPrice * fuelMultiplier;
      
      // Apply reasonable bounds
      estimatedPrice = Math.max(2000, Math.min(80000, estimatedPrice));
      
      // Round to nearest £500
      estimatedPrice = Math.round(estimatedPrice / 500) * 500;
      
      console.log(`🚐 Estimated price for ${make} ${vehicleData.model} (${vehicleYear}): £${estimatedPrice}`);
      
      return estimatedPrice;
      
    } catch (error) {
      console.error('Error calculating estimated van price:', error.message);
      return 15000; // Default £15,000
    }
  }

  /**
   * Parse DVLA API response to extract van data
   * @param {Object} dvlaResponse - Raw DVLA API response
   * @param {string} registration - Vehicle registration number
   * @returns {Object} Parsed van data
   */
  parseDVLAResponse(dvlaResponse, registration) {
    try {
      console.log(`🔍 Parsing DVLA response for van ${registration}`);
      
      // DVLA API response structure
      const parsed = {
        registration: registration,
        make: dvlaResponse.make || null,
        model: dvlaResponse.model || null,
        variant: null, // DVLA doesn't provide variant
        year: dvlaResponse.yearOfManufacture || null,
        color: dvlaResponse.colour || null,
        fuelType: dvlaResponse.fuelType || 'Diesel',
        transmission: 'Manual', // Most vans are manual
        engineSize: dvlaResponse.engineCapacity ? (dvlaResponse.engineCapacity / 1000).toFixed(1) : null,
        bodyType: dvlaResponse.typeApproval || null,
        doors: null, // DVLA doesn't provide doors
        seats: null, // DVLA doesn't provide seats
        emissionClass: dvlaResponse.euroStatus ? `Euro ${dvlaResponse.euroStatus}` : null,
        co2Emissions: dvlaResponse.co2Emissions || null,
        
        // DVLA doesn't provide running costs data
        urbanMpg: null,
        extraUrbanMpg: null,
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
      
      console.log(`✅ DVLA van data parsed: ${parsed.make} ${parsed.model} (${parsed.year})`);
      return parsed;
      
    } catch (error) {
      console.error(`❌ Error parsing DVLA response for van ${registration}:`, error.message);
      throw new Error(`Failed to parse DVLA response: ${error.message}`);
    }
  }
}

module.exports = new LightweightVanService();