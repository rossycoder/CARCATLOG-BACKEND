/**
 * Valuation API Client
 * Handles communication with the vehicle valuation API
 */

const axios = require('axios');
const { parseValuationResponse, handlePartialValuationResponse } = require('../utils/valuationResponseParser');

class ValuationAPIClient {
  constructor(apiKey, baseUrl, isTestMode = false) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.isTestMode = isTestMode;
    this.timeout = 5000; // 5 seconds
    this.maxRetries = 3;
  }

  /**
   * Perform HTTP request with exponential backoff retry logic
   * CheckCardDetails API format: /vehicledata/vehiclevaluation?apikey={API_KEY}&vrm={Registration}&mileage={Mileage}
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} mileage - Current mileage
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async makeRequestWithRetry(vrm, mileage, attempt = 1) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/vehicledata/vehiclevaluation`,
        {
          params: {
            apikey: this.apiKey,
            vrm: vrm.toUpperCase(),
            mileage: mileage,
          },
          timeout: this.timeout,
        }
      );

      return response.data;
    } catch (error) {
      // Check if we should retry
      const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
      const is5xxError = error.response && error.response.status >= 500;

      const shouldRetry = (isTimeout || isNetworkError || is5xxError) && attempt < this.maxRetries;

      if (shouldRetry) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Valuation API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(vrm, mileage, attempt + 1);
      }

      // No more retries, throw error
      throw error;
    }
  }

  /**
   * Get vehicle valuation
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} mileage - Current mileage
   * @returns {Promise<Object>} Valuation result
   * @throws {Error} If parameters are invalid or API call fails
   */
  async getValuation(vrm, mileage) {
    // Validate VRM
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    // Validate mileage
    if (typeof mileage !== 'number' || mileage < 0) {
      throw new Error('Invalid mileage: must be a non-negative number');
    }

    // Validate test mode VRM (same restriction as History API)
    if (this.isTestMode && !vrm.toUpperCase().includes('A')) {
      throw new Error(
        `Invalid VRM for test mode: VRM must contain the letter "A". Current VRM: ${vrm}. ` +
        `To use any VRM, set API_ENVIRONMENT=production in your .env file and restart the server.`
      );
    }

    try {
      const apiResponse = await this.makeRequestWithRetry(vrm, mileage);
      
      // Parse and validate the response
      try {
        const parsedResult = parseValuationResponse(apiResponse, this.isTestMode);
        return parsedResult;
      } catch (parseError) {
        // If parsing fails due to malformed response, try partial parsing
        console.warn('Failed to parse complete valuation response, attempting partial parse');
        const partialResult = handlePartialValuationResponse(apiResponse, this.isTestMode);
        return partialResult;
      }
    } catch (error) {
      // Format error for logging
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        vrm,
        mileage,
        isTestMode: this.isTestMode,
      };

      console.error('Valuation API call failed:', errorDetails);
      
      // Re-throw with more context
      const enhancedError = new Error(
        `Valuation API call failed for VRM ${vrm}: ${error.message}`
      );
      enhancedError.originalError = error;
      enhancedError.details = errorDetails;
      throw enhancedError;
    }
  }
}

module.exports = ValuationAPIClient;
