/**
 * Variant Only Service
 * Fetches ONLY vehicle variant from CheckCarDetails Vehiclespecs API (£0.05)
 * Does NOT call expensive vehicle history API (£1.82)
 */

const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
const VehicleHistory = require('../models/VehicleHistory');
const { normalizeModelVariant } = require('../utils/modelVariantNormalizer');

class VariantOnlyService {
  constructor() {
    this.cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Get ONLY vehicle variant (cheap API call - £0.05)
   * @param {string} registration - Vehicle registration number
   * @param {boolean} useCache - Whether to check cache first (default: true)
   * @returns {Promise<Object>} Vehicle variant data only
   */
  async getVariantOnly(registration, useCache = true) {
    
    // ALWAYS check cache first to prevent duplicate API calls
    const cachedData = await this.checkVariantCache(registration);
    if (cachedData && useCache) {
      return {
        variant: cachedData.variant,
        make: cachedData.make,
        model: cachedData.model,
        engineSize: cachedData.engineSize,
        cached: true,
        cost: 0.00
      };
    }
    
    
    try {
      // Call ONLY Vehiclespecs API (£0.05) - NOT the expensive history API (£1.82)
      
      const vehicleData = await CheckCarDetailsClient.getVehicleData(registration);
      
      if (!vehicleData) {
        return {
          variant: null,
          make: null,
          model: null,
          engineSize: null,
          cached: false,
          cost: 0.05,
          error: 'No vehicle data found'
        };
      }
      
      // Extract variant from API response
      // vehicleData comes from parseCheckCarDetailsResponse which already uses Range as model
      // and ModelData.Model as variant — so vehicleData.variant is the trim detail
      let variant = vehicleData.variant || null;
      let make    = vehicleData.make    || null;
      let model   = vehicleData.model   || null;
      const engineSize = vehicleData.engineSize ? parseFloat(vehicleData.engineSize) : null;

      // CRITICAL: normalise model/variant in case API returns them swapped
      if (model && make) {
        const norm = normalizeModelVariant(model, variant, make);
        model   = norm.model;
        variant = norm.variant;
      }

      // Cache the normalised values
      await this.cacheVariantOnly(registration, { variant, make, model, engineSize });

      return { variant, make, model, engineSize, cached: false, cost: 0.05 };
      
    } catch (error) {
      // Generate fallback variant
      return {
        variant: null,
        make: null,
        model: null,
        engineSize: null,
        cached: false,
        cost: 0.05,
        error: error.message
      };
    }
  }

  /**
   * Check cache for variant data only
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object|null>} Cached variant data or null
   */
  async checkVariantCache(registration) {
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
        return null;
      }

      // Return only variant-related data from cache
      // CRITICAL: normalise model/variant — cache may have old swapped values
      let cachedModel   = cached.model || null;
      let cachedVariant = cached.variant || null;
      if (cachedModel && cached.make) {
        const norm = normalizeModelVariant(cachedModel, cachedVariant, cached.make);
        cachedModel   = norm.model;
        cachedVariant = norm.variant;
      }
      return {
        variant: cachedVariant,
        make: cached.make || null,
        model: cachedModel,
        engineSize: cached.engineCapacity ? parseFloat((cached.engineCapacity / 1000).toFixed(1)) : null
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache ONLY variant data (lightweight cache)
   * @param {string} registration - Vehicle registration number
   * @param {Object} variantData - Variant data only
   * @returns {Promise<Object>} Saved cache entry
   */
  async cacheVariantOnly(registration, variantData) {
    try {
      const cleanedReg = registration.toUpperCase().replace(/\s/g, '');
      
      // Check if full history record already exists
      const existingHistory = await VehicleHistory.findOne({ vrm: cleanedReg });
      
      if (existingHistory) {
        // Update existing record with variant data only
        existingHistory.variant = variantData.variant;
        if (variantData.make) existingHistory.make = variantData.make;
        if (variantData.model) existingHistory.model = variantData.model;
        if (variantData.engineSize) existingHistory.engineCapacity = variantData.engineSize * 1000;
        existingHistory.checkDate = new Date();
        
        await existingHistory.save();
        return existingHistory;
      } else {
        // Create minimal cache entry with variant data only
        const minimalCache = new VehicleHistory({
          vrm: cleanedReg,
          variant: variantData.variant,
          make: variantData.make,
          model: variantData.model,
          engineCapacity: variantData.engineSize ? variantData.engineSize * 1000 : null,
          checkDate: new Date(),
          checkStatus: 'variant_only',
          apiProvider: 'variant-only-service',
          testMode: process.env.API_ENVIRONMENT !== 'production'
        });
        
        await minimalCache.save();
        return minimalCache;
      }
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate fallback variant from car data
   * @param {Object} carData - Car data with engineSize and fuelType
   * @returns {string} Generated variant
   */
  generateFallbackVariant(carData) {
    if (carData.engineSize && carData.fuelType) {
      return `${carData.engineSize}L ${carData.fuelType}`;
    } else if (carData.fuelType) {
      return carData.fuelType;
    } else {
      return 'Standard';
    }
  }
}

module.exports = new VariantOnlyService();