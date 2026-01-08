/**
 * History Service
 * Business logic for vehicle history checks
 */

const HistoryAPIClient = require('../clients/HistoryAPIClient');
const VehicleHistory = require('../models/VehicleHistory');
const { loadAPICredentials, getActiveAPIKey, getActiveBaseUrl } = require('../config/apiCredentials');

class HistoryService {
  constructor() {
    // Load credentials
    const credentials = loadAPICredentials();
    const environment = credentials.environment;
    const isTestMode = environment === 'test';

    // Initialize API client
    const apiKey = getActiveAPIKey(credentials.historyAPI, environment);
    const baseUrl = getActiveBaseUrl(credentials.historyAPI, environment);
    
    this.client = new HistoryAPIClient(apiKey, baseUrl, isTestMode);
    this.isTestMode = isTestMode;
  }

  /**
   * Get cached history check result
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object|null>} Cached history result or null
   */
  async getCachedHistory(vrm) {
    try {
      const cached = await VehicleHistory.getMostRecent(vrm);
      
      // Check if cache is still fresh (within 30 days)
      if (cached) {
        const daysSinceCheck = (Date.now() - cached.checkDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCheck <= 30) {
          console.log(`Using cached history for VRM ${vrm} (${Math.floor(daysSinceCheck)} days old)`);
          return cached;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached history:', error);
      return null;
    }
  }

  /**
   * Store history check result in database
   * @param {string} vrm - Vehicle Registration Mark
   * @param {Object} result - History check result
   * @returns {Promise<Object>} Saved history document
   */
  async storeHistoryResult(vrm, result) {
    try {
      const historyDoc = new VehicleHistory({
        ...result,
        vrm: vrm.toUpperCase(),
      });

      await historyDoc.save();
      console.log(`Stored history check for VRM ${vrm}`);
      
      return historyDoc;
    } catch (error) {
      console.error('Error storing history result:', error);
      throw error;
    }
  }

  /**
   * Perform vehicle history check
   * @param {string} vrm - Vehicle Registration Mark
   * @param {boolean} forceRefresh - Force new check even if cached data exists
   * @returns {Promise<Object>} History check result
   */
  async checkVehicleHistory(vrm, forceRefresh = false) {
    const startTime = Date.now();
    
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = await this.getCachedHistory(vrm);
        if (cached) {
          return cached.toObject();
        }
      }

      // Call CheckCardDetails API
      console.log(`Calling CheckCardDetails History API for VRM ${vrm}`);
      console.log(`API Endpoint: ${this.client.baseUrl}/vehicledata/history`);
      
      const result = await this.client.checkHistory(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`History API call completed in ${responseTime}ms`);

      // Store result
      const stored = await this.storeHistoryResult(vrm, result);
      
      return stored.toObject();
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`History API call failed after ${responseTime}ms:`, error.message);

      // Provide helpful error message
      const isNetworkError = error.code === 'ENOTFOUND' || 
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      
      if (isNetworkError) {
        const enhancedError = new Error(
          `CheckCardDetails History API is not reachable. ` +
          `Please verify the API endpoint (${this.client.baseUrl}) and your network connection. ` +
          `Original error: ${error.message}`
        );
        enhancedError.originalError = error;
        enhancedError.isNetworkError = true;
        throw enhancedError;
      }

      throw error;
    }
  }

  /**
   * Get MOT history for a vehicle
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} MOT history data
   */
  async getMOTHistory(vrm) {
    const startTime = Date.now();
    
    try {
      console.log(`Fetching MOT history for VRM ${vrm}`);
      
      // Call the MOT history API (using CheckCardDetails or DVSA MOT API)
      const result = await this.client.getMOTHistory(vrm);
      
      const responseTime = Date.now() - startTime;
      console.log(`MOT History API call completed in ${responseTime}ms`);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`MOT History API call failed after ${responseTime}ms:`, error.message);

      // Provide helpful error message
      const isNetworkError = error.code === 'ENOTFOUND' || 
                             error.details?.code === 'ENOTFOUND' ||
                             error.originalError?.code === 'ENOTFOUND';
      
      if (isNetworkError) {
        const enhancedError = new Error(
          `MOT History API is not reachable. ` +
          `Please verify the API endpoint and your network connection. ` +
          `Original error: ${error.message}`
        );
        enhancedError.originalError = error;
        enhancedError.isNetworkError = true;
        throw enhancedError;
      }

      throw error;
    }
  }
}

module.exports = HistoryService;
