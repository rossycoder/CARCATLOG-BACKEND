/**
 * Lightweight Vehicle Service
 * Only fetches basic vehicle data for CarFinder form - NO expensive API calls
 * Uses cheap Vehiclespecs API (£0.05) instead of expensive CheckCarDetails (£1.82)
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const VehicleHistory = require('../models/VehicleHistory');

class LightweightVehicleService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get basic vehicle data for CarFinder form - NO expensive APIs
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage
   * @returns {Promise<Object>} Basic vehicle data only
   */
  async getBasicVehicleDataForCarFinder(registration, mileage) {
    console.log(`🔍 CarFinder lookup for: ${registration} (basic data only)`);
    
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
    
    console.log(`❌ CACHE MISS for ${registration} - Making basic API call (Vehiclespecs only)`);
    
    try {
      // Use ONLY Vehiclespecs API (£0.05) - NO expensive vehicle history/MOT APIs
      const vehicleData = await CheckCarDetailsClient.getVehicleSpecs(registration);
      
      if (!vehicleData) {
        throw new Error('No vehicle data found');
      }
      
      // Parse the response to get basic vehicle data
      const parsedData = CheckCarDetailsClient.parseResponse(vehicleData);
      
      // Format basic vehicle data for CarFinder (no history/MOT data)
      const basicData = {
        registration: registration,
        mileage: mileage,
        make: parsedData.make || null,
        model: parsedData.model || null,
        variant: parsedData.variant || parsedData.modelVariant || null,
        year: parsedData.year || null,
        color: parsedData.color || null,
        fuelType: parsedData.fuelType || null,
        transmission: parsedData.transmission || 'Manual',
        engineSize: parsedData.engineSize ? `${parseFloat(parsedData.engineSize).toFixed(1)}L` : null,
        bodyType: parsedData.bodyType || null,
        doors: parsedData.doors || null,
        seats: parsedData.seats || null,
        gearbox: parsedData.gearbox || parsedData.numberOfGears || null,
        emissionClass: parsedData.emissionClass || parsedData.euroStatus ? `Euro ${parsedData.euroStatus}` : null,
        co2Emissions: parsedData.co2Emissions || null,
        
        // Add running costs if available from API
        urbanMpg: parsedData.urbanMpg || parsedData.fuelEconomyUrban || null,
        extraUrbanMpg: parsedData.extraUrbanMpg || parsedData.fuelEconomyExtraUrban || null,
        combinedMpg: parsedData.combinedMpg || parsedData.fuelEconomyCombined || null,
        annualTax: parsedData.annualTax || parsedData.roadTax || null,
        insuranceGroup: parsedData.insuranceGroup || null,
        
        // Add estimated pricing based on vehicle age and type
        estimatedValue: this.calculateEstimatedPrice(parsedData),
        
        // NO vehicle history, MOT history, or detailed valuation data for CarFinder
        // These will be fetched later when car is actually saved
        
        // Metadata
        apiProvider: 'vehiclespecs-only',
        checkDate: new Date(),
        fromCache: false
      };
      
      // Cache the basic data for future CarFinder lookups
      await this.cacheBasicDataOnly(registration, basicData);
      
      console.log(`✅ CarFinder lookup successful for ${registration}`);
      console.log(`   API Cost: £0.05 (Vehiclespecs only), Data: ${basicData.make} ${basicData.model}`);
      
      return {
        success: true,
        data: basicData,
        fromCache: false,
        apiCalls: 1,
        cost: 0.05
      };
      
    } catch (error) {
      console.error(`❌ CarFinder lookup failed for ${registration}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        data: null,
        fromCache: false,
        apiCalls: 1,
        cost: 0.05
      };
    }
  }

  /**
   * Check cache for basic vehicle data only
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

      // Return basic vehicle data from cache (no history/MOT data)
      return {
        registration: cached.vrm,
        make: cached.make,
        model: cached.model,
        variant: cached.variant,
        year: cached.yearOfManufacture,
        color: cached.colour,
        fuelType: cached.fuelType,
        transmission: cached.transmission,
        engineSize: cached.engineCapacity ? 
          (cached.engineCapacity > 10 ? `${(cached.engineCapacity / 1000).toFixed(1)}L` : `${parseFloat(cached.engineCapacity).toFixed(1)}L`) 
          : null,
        bodyType: cached.bodyType,
        doors: cached.doors,
        seats: cached.seats,
        gearbox: cached.gearbox,
        emissionClass: cached.emissionClass,
        co2Emissions: cached.co2Emissions,
        
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
   * Cache basic vehicle data only (no expensive history/MOT data)
   * @param {string} registration - Vehicle registration number
   * @param {Object} basicData - Basic vehicle data
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
        existing.gearbox = basicData.gearbox || existing.gearbox;
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
        console.log(`✅ Updated existing cache for ${registration} (basic data only)`);
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
          gearbox: basicData.gearbox,
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
          motHistory: [], // Empty - will be filled when car is saved
          
          checkDate: new Date(),
          checkStatus: 'basic-only',
          apiProvider: 'vehiclespecs-only',
          testMode: process.env.API_ENVIRONMENT !== 'production'
        };
        
        const savedHistory = new VehicleHistory(cacheData);
        await savedHistory.save();
        
        console.log(`✅ Created new cache for ${registration} with ID: ${savedHistory._id} (basic data only)`);
        return savedHistory;
      }
      
    } catch (error) {
      console.error(`❌ Cache storage error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate estimated price based on vehicle data
   * @param {Object} vehicleData - Basic vehicle data
   * @returns {number} Estimated price in GBP
   */
  calculateEstimatedPrice(vehicleData) {
    try {
      const currentYear = new Date().getFullYear();
      const vehicleYear = parseInt(vehicleData.year) || currentYear;
      const vehicleAge = Math.max(0, currentYear - vehicleYear);
      
      // Base prices by make (rough estimates)
      const basePrices = {
        'BMW': 25000,
        'MERCEDES': 30000,
        'AUDI': 28000,
        'VOLKSWAGEN': 20000,
        'FORD': 15000,
        'VAUXHALL': 12000,
        'HONDA': 18000,
        'TOYOTA': 20000,
        'NISSAN': 16000,
        'HYUNDAI': 14000,
        'KIA': 13000,
        'PEUGEOT': 14000,
        'RENAULT': 13000,
        'CITROEN': 12000,
        'FIAT': 11000,
        'SKODA': 16000,
        'SEAT': 15000,
        'MAZDA': 17000,
        'SUBARU': 22000,
        'MITSUBISHI': 15000,
        'SUZUKI': 12000,
        'MINI': 20000,
        'JAGUAR': 35000,
        'LAND ROVER': 40000,
        'VOLVO': 25000,
        'SAAB': 18000
      };
      
      const make = (vehicleData.make || '').toUpperCase();
      let basePrice = basePrices[make] || 15000; // Default £15,000
      
      // Adjust for vehicle age (depreciation)
      const depreciationRate = 0.15; // 15% per year
      const depreciatedPrice = basePrice * Math.pow(1 - depreciationRate, vehicleAge);
      
      // Adjust for fuel type
      let fuelMultiplier = 1.0;
      const fuelType = (vehicleData.fuelType || '').toLowerCase();
      if (fuelType.includes('electric')) {
        fuelMultiplier = 1.2; // Electric cars hold value better
      } else if (fuelType.includes('hybrid')) {
        fuelMultiplier = 1.1; // Hybrids slightly better
      } else if (fuelType.includes('diesel')) {
        fuelMultiplier = 0.9; // Diesel slightly lower due to emissions concerns
      }
      
      // Adjust for engine size
      let engineMultiplier = 1.0;
      const engineSize = parseFloat(vehicleData.engineSize) || 1.6;
      if (engineSize >= 3.0) {
        engineMultiplier = 1.2; // Large engines
      } else if (engineSize >= 2.0) {
        engineMultiplier = 1.1; // Medium engines
      } else if (engineSize <= 1.0) {
        engineMultiplier = 0.9; // Small engines
      }
      
      // Calculate final estimated price
      let estimatedPrice = depreciatedPrice * fuelMultiplier * engineMultiplier;
      
      // Apply reasonable bounds
      estimatedPrice = Math.max(1000, Math.min(100000, estimatedPrice));
      
      // Round to nearest £500
      estimatedPrice = Math.round(estimatedPrice / 500) * 500;
      
      console.log(`💰 Estimated price for ${make} ${vehicleData.model} (${vehicleYear}): £${estimatedPrice}`);
      console.log(`   Base: £${basePrice}, Age: ${vehicleAge}y, Fuel: ${fuelType}, Engine: ${engineSize}L`);
      
      return estimatedPrice;
      
    } catch (error) {
      console.error('Error calculating estimated price:', error.message);
      return 10000; // Default £10,000
    }
  }
}

module.exports = new LightweightVehicleService();