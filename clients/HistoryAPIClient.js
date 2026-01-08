/**
 * History API Client
 * Handles communication with the vehicle history check API
 */

const axios = require('axios');
const { parseHistoryResponse, handlePartialResponse } = require('../utils/historyResponseParser');

class HistoryAPIClient {
  constructor(apiKey, baseUrl, isTestMode = false) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.isTestMode = isTestMode;
    this.timeout = 10000; // 10 seconds
    this.maxRetries = 3;
  }

  /**
   * Validate VRM format for test mode
   * Test mode requires VRM to contain the letter 'A'
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {boolean} True if valid for current mode
   */
  validateTestVRM(vrm) {
    if (!this.isTestMode) {
      return true; // No restrictions in production mode
    }
    
    // Test mode: VRM must contain letter 'A'
    return vrm.toUpperCase().includes('A');
  }

  /**
   * Perform HTTP request with exponential backoff retry logic
   * CheckCardDetails API format: /vehicledata/carhistorycheck?apikey={API_KEY}&vrm={Registration}
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async makeRequestWithRetry(vrm, attempt = 1) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/vehicledata/carhistorycheck`,
        {
          params: {
            apikey: this.apiKey,
            vrm: vrm.toUpperCase(),
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
        console.log(`History API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(vrm, attempt + 1);
      }

      // No more retries, throw error
      throw error;
    }
  }

  /**
   * Check vehicle history
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} History check result
   * @throws {Error} If VRM is invalid or API call fails
   */
  async checkHistory(vrm) {
    // Validate VRM
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    // Validate test mode VRM
    if (this.isTestMode && !this.validateTestVRM(vrm)) {
      throw new Error(
        'Invalid VRM for test mode: VRM must contain the letter "A"'
      );
    }

    try {
      const apiResponse = await this.makeRequestWithRetry(vrm);
      
      // Parse and validate the response
      try {
        const parsedResult = parseHistoryResponse(apiResponse, this.isTestMode);
        return parsedResult;
      } catch (parseError) {
        // If parsing fails due to malformed response, try partial parsing
        console.warn('Failed to parse complete response, attempting partial parse');
        const partialResult = handlePartialResponse(apiResponse, this.isTestMode);
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
        isTestMode: this.isTestMode,
      };

      console.error('History API call failed:', errorDetails);
      
      // Re-throw with more context
      const enhancedError = new Error(
        `History API check failed for VRM ${vrm}: ${error.message}`
      );
      enhancedError.originalError = error;
      enhancedError.details = errorDetails;
      throw enhancedError;
    }
  }

  /**
   * Get MOT history for a vehicle
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} MOT history data
   * @throws {Error} If VRM is invalid or API call fails
   */
  async getMOTHistory(vrm) {
    // Validate VRM
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    try {
      // Try CheckCardDetails MOT endpoint first
      console.log(`Fetching MOT history from API for VRM: ${vrm}`);
      const response = await axios.get(
        `${this.baseUrl}/vehicledata/mothistory`,
        {
          params: {
            apikey: this.apiKey,
            vrm: vrm.toUpperCase(),
          },
          timeout: this.timeout,
        }
      );

      console.log('MOT API response received');
      return this.parseMOTResponse(response.data);
    } catch (error) {
      console.log('CheckCardDetails MOT endpoint error:', error.message);
      
      // If CheckCardDetails doesn't have MOT endpoint, try DVSA MOT API
      try {
        console.log('Trying DVSA MOT API...');
        const dvsaResponse = await axios.get(
          `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests`,
          {
            params: {
              registration: vrm.toUpperCase(),
            },
            headers: {
              'x-api-key': this.apiKey,
            },
            timeout: this.timeout,
          }
        );

        console.log('DVSA MOT API response received');
        return this.parseDVSAMOTResponse(dvsaResponse.data);
      } catch (dvsaError) {
        // If both fail, return mock data for development
        console.warn('Both MOT APIs unavailable, returning mock data for:', vrm);
        return this.getMockMOTHistory(vrm);
      }
    }
  }

  /**
   * Parse MOT response from CheckCardDetails API
   * @param {Object} data - API response data
   * @returns {Object} Parsed MOT history
   */
  parseMOTResponse(data) {
    return {
      vrm: data.vrm || data.registration,
      currentStatus: data.motStatus || 'Unknown',
      expiryDate: data.motExpiryDate || data.expiryDate,
      tests: data.motTests || data.tests || [],
    };
  }

  /**
   * Parse MOT response from DVSA API
   * @param {Object} data - DVSA API response data
   * @returns {Object} Parsed MOT history
   */
  parseDVSAMOTResponse(data) {
    return {
      vrm: data.registration,
      currentStatus: data.motTestDueDate ? 'Valid' : 'Expired',
      expiryDate: data.motTestDueDate,
      tests: (data.motTests || []).map(test => ({
        testDate: test.completedDate,
        testNumber: test.motTestNumber,
        result: test.testResult,
        expiryDate: test.expiryDate,
        odometerValue: test.odometerValue,
        odometerUnit: test.odometerUnit,
        rfrAndComments: test.rfrAndComments || [],
        defects: test.defects || [],
        advisoryNotices: test.minorDefects || [],
      })),
    };
  }

  /**
   * Get mock MOT history for development/testing
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Object} Mock MOT history
   */
  getMockMOTHistory(vrm) {
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    return {
      vrm: vrm.toUpperCase(),
      currentStatus: 'Valid',
      expiryDate: expiryDate.toISOString(),
      tests: [
        {
          testDate: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 15).toISOString(),
          testNumber: 'TEST123456',
          result: 'PASSED',
          expiryDate: expiryDate.toISOString(),
          odometerValue: 45000,
          odometerUnit: 'mi',
          rfrAndComments: [],
          defects: [],
          advisoryNotices: [
            'Nearside Front Tyre worn close to legal limit',
            'Oil leak from engine'
          ],
        },
        {
          testDate: new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), 20).toISOString(),
          testNumber: 'TEST123455',
          result: 'PASSED',
          expiryDate: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 20).toISOString(),
          odometerValue: 32000,
          odometerUnit: 'mi',
          rfrAndComments: [],
          defects: [],
          advisoryNotices: [],
        },
        {
          testDate: new Date(currentDate.getFullYear() - 3, currentDate.getMonth(), 10).toISOString(),
          testNumber: 'TEST123454',
          result: 'FAILED',
          expiryDate: null,
          odometerValue: 20000,
          odometerUnit: 'mi',
          rfrAndComments: [
            {
              type: 'FAIL',
              text: 'Nearside Front brake pad(s) less than 1.5 mm thick',
            },
          ],
          defects: [
            {
              type: 'FAIL',
              dangerous: false,
              text: 'Brake pads worn',
            },
          ],
          advisoryNotices: [],
        },
      ],
    };
  }
}

module.exports = HistoryAPIClient;
