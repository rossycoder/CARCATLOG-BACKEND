/**
 * Valuation Service
 * Business logic for vehicle valuations
 */

const ValuationAPIClient = require('../clients/ValuationAPIClient');
const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');
const dvlaService = require('./dvlaService');

class ValuationService {
  constructor() {
    // Load credentials
    const credentials = loadAPICredentials();
    const environment = credentials.environment;
    const isTestMode = environment === 'test';

    // Initialize API client
    const apiKey = getActiveAPIKey(credentials.valuationAPI, environment);
    const baseUrl = getActiveBaseUrl(credentials.valuationAPI, environment);
    
    this.client = new ValuationAPIClient(apiKey, baseUrl, isTestMode);
    this.isTestMode = isTestMode;
    
    console.log(`ValuationService initialized in ${environment} mode (Test Mode: ${isTestMode})`);
  }





  /**
   * Get vehicle valuation
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} mileage - Current mileage
   * @param {boolean} forceRefresh - Force new valuation even if cached data exists
   * @returns {Promise<Object>} Valuation result
   */
  async getValuation(vrm, mileage, forceRefresh = false) {
    const startTime = Date.now();
    
    try {
      // Call CheckCardDetails API
      console.log(`Calling CheckCardDetails Valuation API for VRM ${vrm} with mileage ${mileage}`);
      console.log(`API Endpoint: ${this.client.baseUrl}/vehicledata/valuation`);
      
      const result = await this.client.getValuation(vrm, mileage);
      
      const responseTime = Date.now() - startTime;
      console.log(`Valuation API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Valuation API call failed after ${responseTime}ms:`, error.message);

      // Re-throw the error - no mock data fallback
      throw error;
    }
  }

  /**
   * Get detailed valuation with DVLA vehicle information
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} mileage - Current mileage
   * @returns {Promise<Object>} Combined DVLA and valuation data
   */
  async getDetailedValuation(vrm, mileage) {
    try {
      // Get valuation first (this is the primary data)
      const valuation = await this.getValuation(vrm, mileage);
      
      // Try to get DVLA vehicle details (optional enhancement)
      let dvlaData = null;
      try {
        console.log(`Fetching DVLA details for ${vrm}`);
        dvlaData = await dvlaService.lookupVehicle(vrm);
      } catch (dvlaError) {
        console.warn(`DVLA lookup failed for ${vrm}:`, dvlaError.message);
        // Continue without DVLA data - valuation is still valid
      }
      
      // Combine data
      return {
        vehicleDetails: dvlaData,
        valuation,
      };
    } catch (error) {
      console.error('Error getting detailed valuation:', error);
      throw error;
    }
  }
}

module.exports = ValuationService;
