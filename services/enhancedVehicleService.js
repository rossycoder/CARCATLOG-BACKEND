/**
 * Enhanced Vehicle Service
 * Calls CheckCarDetails and Valuation APIs in parallel and merges results
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const ValuationAPIClientClass = require('../clients/ValuationAPIClient');
const dataMerger = require('../utils/dataMerger');
const VehicleHistory = require('../models/VehicleHistory');

// Initialize ValuationAPIClient with credentials
const ValuationAPIClient = new ValuationAPIClientClass(
  process.env.CHECKCARD_API_KEY,
  process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk',
  process.env.API_ENVIRONMENT !== 'production'
);

class EnhancedVehicleService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get enhanced vehicle data from CheckCarDetails and Valuation APIs
   * @param {string} registration - Vehicle registration number
   * @param {boolean} useCache - Whether to check cache first (default: true)
   * @param {number} mileage - Optional mileage for valuation (default: estimated from MOT)
   * @returns {Promise<Object>} Merged vehicle data with source tracking
   */
  async getEnhancedVehicleData(registration, useCache = true, mileage = null) {
    console.log(`Enhanced vehicle lookup for: ${registration}`);
    
    // Check cache first if enabled
    if (useCache) {
      const cachedData = await this.checkCache(registration);
      if (cachedData) {
        console.log(`Cache hit for ${registration}`);
        return cachedData;
      }
    }

    // Call CheckCarDetails first to get vehicle data and mileage if not provided
    const [checkCarResult] = await Promise.allSettled([
      this.callCheckCarDetailsAPI(registration)
    ]);

    // Extract data from results
    const checkCarData = checkCarResult.status === 'fulfilled' ? checkCarResult.value : null;

    // Estimate mileage if not provided (use CheckCarDetails or default)
    const estimatedMileage = mileage || checkCarData?.mileage || 50000;

    // Now call valuation API with mileage
    const valuationResult = await Promise.allSettled([
      this.callValuationAPI(registration, estimatedMileage)
    ]);

    const valuationData = valuationResult[0].status === 'fulfilled' ? valuationResult[0].value : null;

    // Log API call results
    this.logAPIResults(registration, checkCarResult, valuationResult[0]);

    // Merge data using Data Merger
    const mergedData = dataMerger.merge(checkCarData, valuationData);

    // Add registration number to merged data
    mergedData.registration = registration;

    // Cache the merged data
    await this.cacheData(registration, mergedData);

    return mergedData;
  }

  /**
   * Call CheckCarDetails API with error handling
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} CheckCarDetails data or null if failed
   */
  async callCheckCarDetailsAPI(registration) {
    try {
      console.log(`Calling CheckCarDetails API for ${registration}`);
      const data = await CheckCarDetailsClient.getVehicleData(registration);
      console.log(`CheckCarDetails API success for ${registration}:`, JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error(`CheckCarDetails API error for ${registration}:`, error.message);
      console.error(`CheckCarDetails error details:`, error);
      return null;
    }
  }

  /**
   * Call Valuation API with error handling
   * @param {string} registration - Vehicle registration number
   * @param {number} mileage - Vehicle mileage (default: 50000 if not provided)
   * @returns {Promise<Object|null>} Valuation data or null if failed
   */
  async callValuationAPI(registration, mileage = 50000) {
    try {
      console.log(`Calling Valuation API for ${registration} with mileage ${mileage}`);
      const data = await ValuationAPIClient.getValuation(registration, mileage);
      return data;
    } catch (error) {
      console.error(`Valuation API error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Check cache for existing vehicle data
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} Cached data or null
   */
  async checkCache(registration) {
    try {
      const cached = await VehicleHistory.findOne({
        vrm: registration.toUpperCase().replace(/\s/g, '')
      });

      if (!cached) {
        return null;
      }

      // Check if cache is still valid (within TTL)
      const cacheAge = Date.now() - new Date(cached.checkDate).getTime();
      if (cacheAge > this.cacheTTL) {
        console.log(`Cache expired for ${registration} (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
        return null;
      }

      // Reconstruct merged data format from cached fields
      // Note: We don't cache the full merged data structure, just basic fields
      // So we return null to force a fresh API call for complete data
      console.log(`Cache found for ${registration} but returning null to get fresh complete data`);
      return null;
    } catch (error) {
      console.error(`Cache check error for ${registration}:`, error.message);
      return null;
    }
  }

  /**
   * Cache merged vehicle data
   * @param {string} registration - Vehicle registration number
   * @param {Object} mergedData - Merged vehicle data
   * @returns {Promise<void>}
   */
  async cacheData(registration, mergedData) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      
      // Extract basic fields from merged data for schema compatibility
      const cacheData = {
        vrm: cleanedReg, // Use 'vrm' not 'registration' to match schema
        make: mergedData.make?.value || null,
        model: mergedData.model?.value || null,
        colour: mergedData.color?.value || null,
        fuelType: mergedData.fuelType?.value || null,
        yearOfManufacture: mergedData.year?.value || null,
        engineCapacity: mergedData.engineSize?.value || null,
        transmission: mergedData.transmission?.value || null,
        co2Emissions: mergedData.runningCosts?.co2Emissions?.value || null,
        gearbox: mergedData.gearbox?.value || null,
        emissionClass: mergedData.emissionClass?.value || null,
        // CRITICAL: Extract owner/keeper information from merged data
        numberOfPreviousKeepers: mergedData.numberOfPreviousKeepers?.value || 0,
        previousOwners: mergedData.numberOfPreviousKeepers?.value || 0,
        numberOfOwners: mergedData.numberOfPreviousKeepers?.value || 0,
        v5cCertificateCount: mergedData.v5cCertificateCount?.value || 0,
        plateChanges: mergedData.plateChanges?.value || 0,
        colourChanges: mergedData.colourChanges?.value || 0,
        vicCount: mergedData.vicCount?.value || 0,
        // History flags
        hasAccidentHistory: mergedData.hasAccidentHistory?.value || false,
        isStolen: mergedData.isStolen?.value || false,
        isWrittenOff: mergedData.isWrittenOff?.value || false,
        isScrapped: mergedData.isScrapped?.value || false,
        isImported: mergedData.isImported?.value || false,
        isExported: mergedData.isExported?.value || false,
        hasOutstandingFinance: mergedData.hasOutstandingFinance?.value || false,
        numberOfKeys: 1,
        keys: 1,
        serviceHistory: 'Contact seller',
        checkDate: new Date(),
        checkStatus: 'success',
        apiProvider: 'enhanced-vehicle-service',
        testMode: process.env.API_ENVIRONMENT !== 'production'
      };
      
      await VehicleHistory.findOneAndUpdate(
        { vrm: cleanedReg },
        cacheData,
        { upsert: true, new: true }
      );

      console.log(`Cached enhanced data for ${registration}`);
    } catch (error) {
      console.error(`Cache storage error for ${registration}:`, error.message);
      // Don't throw - caching failure shouldn't break the request
    }
  }

  /**
   * Log API call results for monitoring
   * @param {string} registration - Vehicle registration number
   * @param {Object} checkCarResult - CheckCarDetails Promise.allSettled result
   * @param {Object} valuationResult - Valuation Promise.allSettled result
   */
  logAPIResults(registration, checkCarResult, valuationResult) {
    const checkCarStatus = checkCarResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed';
    const valuationStatus = valuationResult.status === 'fulfilled' ? '✅ Success' : '❌ Failed';

    console.log(`API Results for ${registration}:`);
    console.log(`  CheckCarDetails: ${checkCarStatus}`);
    console.log(`  Valuation: ${valuationStatus}`);

    if (checkCarResult.status === 'rejected') {
      console.log(`  CheckCarDetails Error: ${checkCarResult.reason}`);
    }
    if (valuationResult.status === 'rejected') {
      console.log(`  Valuation Error: ${valuationResult.reason}`);
    }
  }

  /**
   * Get vehicle data with fallback handling
   * Returns data even if one API fails
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle data with status information
   */
  async getVehicleDataWithFallback(registration) {
    try {
      const enhancedData = await this.getEnhancedVehicleData(registration);
      
      return {
        success: true,
        data: enhancedData,
        warnings: this.generateWarnings(enhancedData)
      };
    } catch (error) {
      console.error(`Enhanced vehicle lookup failed for ${registration}:`, error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Generate warnings based on data sources
   * @param {Object} enhancedData - Enhanced vehicle data
   * @returns {Array<string>} Array of warning messages
   */
  generateWarnings(enhancedData) {
    const warnings = [];

    const sources = enhancedData.dataSources || {};

    if (!sources.checkCarDetails && !sources.valuation) {
      warnings.push('No data available from any API');
    } else {
      if (!sources.checkCarDetails) {
        warnings.push('CheckCarDetails data unavailable');
      }
      if (!sources.valuation) {
        warnings.push('Valuation data unavailable');
      }
    }

    return warnings;
  }

  /**
   * Clear cache for a specific registration
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<boolean>} True if cache was cleared
   */
  async clearCache(registration) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      const result = await VehicleHistory.deleteOne({ vrm: cleanedReg });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Cache clear error for ${registration}:`, error.message);
      return false;
    }
  }
}

module.exports = new EnhancedVehicleService();
