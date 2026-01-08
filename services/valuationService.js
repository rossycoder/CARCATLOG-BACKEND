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
   * Generate mock valuation data when API is unavailable
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} mileage - Current mileage
   * @returns {Object} Mock valuation data
   */
  generateMockValuation(vrm, mileage) {
    // Generate realistic-looking mock values based on mileage
    const baseValue = 15000;
    const mileageDeduction = Math.floor(mileage / 1000) * 100;
    const retailValue = Math.max(5000, baseValue - mileageDeduction + 2000);
    const privateValue = Math.max(4000, baseValue - mileageDeduction);
    const tradeValue = Math.max(3000, baseValue - mileageDeduction - 1500);

    return {
      vrm: vrm.toUpperCase(),
      mileage,
      estimatedValue: {
        retail: retailValue,
        private: privateValue,
        trade: tradeValue,
      },
      valuationDate: new Date(),
      confidence: 'low',
      dataSource: 'mock',
      isMockData: true,
      message: 'Valuation API is currently unavailable. This is estimated data only.',
    };
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

      // Check if this is a network/DNS error
      const isNetworkError = error.code === 'ENOTFOUND' || 
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND' ||
                             error.code === 'ECONNREFUSED' ||
                             error.originalError?.code === 'ECONNREFUSED';
      
      if (isNetworkError) {
        console.warn(`Valuation API unreachable for VRM ${vrm}, returning mock data`);
        // Return mock data instead of throwing error
        const mockData = this.generateMockValuation(vrm, mileage);
        return mockData;
      }

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
