/**
 * CheckCarDetails API Client
 * Handles communication with CheckCarDetails API for running costs data
 * API Documentation: https://api.checkcardetails.co.uk
 * 
 * NOTE: This client only handles HTTP communication.
 * Business logic and data parsing is handled by ApiResponseParser utility.
 */

const axios = require('axios');
const ApiResponseParser = require('../utils/apiResponseParser');
const { parseHistoryResponse } = require('../utils/historyResponseParser');

class CheckCarDetailsClient {
  constructor() {
    this.baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    // Use production key by default, fall back to test key if specified
    this.apiKey = process.env.CHECKCARD_API_KEY || process.env.CHECKCARD_API_TEST_KEY;
    this.isTestMode = process.env.API_ENVIRONMENT === 'test';
    this.timeout = 10000; // 10 seconds
    this.maxRetries = 2; // Retry once on failure
    
    // Log configuration (without exposing full API key)
    const keyPreview = this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET';
    console.log(`CheckCarDetails Client initialized: ${this.isTestMode ? 'TEST' : 'PRODUCTION'} mode`);
    console.log(`Base URL: ${this.baseURL}, API Key: ${keyPreview}`);
  }

  /**
   * Validate API key is configured
   * @throws {Error} If API key is missing
   */
  validateApiKey() {
    if (!this.apiKey) {
      const error = new Error('CheckCarDetails API key not configured');
      error.code = 'MISSING_API_KEY';
      console.error('CheckCarDetails API key missing. Please set CHECKCARD_API_KEY in .env file');
      throw error;
    }
  }

  /**
   * Validate VRM format
   * @param {string} registration - Vehicle registration number
   * @throws {Error} If VRM is invalid
   */
  validateVRM(registration) {
    if (!registration || typeof registration !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    // In test mode, VRM must contain letter 'A'
    if (this.isTestMode && !registration.toUpperCase().includes('A')) {
      throw new Error(
        `Invalid VRM for test mode: VRM must contain the letter "A". Current VRM: ${registration}. ` +
        `To use any VRM, set API_ENVIRONMENT=production in your .env file.`
      );
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} datapoint - API datapoint (e.g., 'ukvehicledata', 'Vehiclespecs', 'vehiclevaluation')
   * @param {string} registration - Vehicle registration number
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async makeRequestWithRetry(datapoint, registration, attempt = 1) {
    try {
      // API structure: /vehicledata/{Datapoint}?apikey={API_KEY}&vrm={Registration}
      const url = `${this.baseURL}/vehicledata/${datapoint}`;
      
      console.log(`CheckCarDetails API request: ${url}?vrm=${registration.toUpperCase()} (attempt ${attempt}/${this.maxRetries + 1})`);

      const response = await axios.get(url, {
        params: {
          apikey: this.apiKey,
          vrm: registration.toUpperCase() // VRM as query parameter
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      console.log(`CheckCarDetails API success for ${registration} (${datapoint})`);
      return response.data;

    } catch (error) {
      // Determine if we should retry
      const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
      const is500Error = error.response && error.response.status === 500;
      
      const shouldRetry = (isTimeout || isNetworkError || is500Error) && attempt <= this.maxRetries;

      if (shouldRetry) {
        // Exponential backoff: 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`CheckCarDetails API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(datapoint, registration, attempt + 1);
      }

      // No more retries, throw error
      throw error;
    }
  }

  /**
   * Fetch full UK vehicle data (includes running costs, specs, etc.)
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Full vehicle data
   */
  async getUKVehicleData(registration) {
    return this.makeRequestWithRetry('ukvehicledata', registration);
  }

  /**
   * Fetch vehicle specifications
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle specifications
   */
  async getVehicleSpecs(registration) {
    return this.makeRequestWithRetry('Vehiclespecs', registration);
  }

  /**
   * Fetch vehicle valuation data
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle valuation
   */
  async getVehicleValuation(registration) {
    return this.makeRequestWithRetry('vehiclevaluation', registration);
  }

  /**
   * Fetch MOT history
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} MOT history
   */
  async getMOTHistory(registration) {
    return this.makeRequestWithRetry('mot', registration);
  }

  /**
   * Fetch vehicle history check
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle history
   */
  async getVehicleHistory(registration) {
    return this.makeRequestWithRetry('carhistorycheck', registration);
  }

  /**
   * Check vehicle history (alias for getVehicleHistory with parsing)
   * Used by HistoryService for compatibility
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Parsed vehicle history
   */
  async checkHistory(registration) {
    const rawData = await this.getVehicleHistory(registration);
    // Use historyResponseParser for history data (includes write-off category parsing)
    return parseHistoryResponse(rawData, this.isTestMode);
  }

  /**
   * Parse API response - delegates to ApiResponseParser utility
   * @param {Object} data - Raw API response
   * @returns {Object} Parsed vehicle data
   * @deprecated Use ApiResponseParser.parseCheckCarDetailsResponse() directly
   */
  parseResponse(data) {
    return ApiResponseParser.parseCheckCarDetailsResponse(data);
  }

  /**
   * Handle API errors and format error messages
   * @param {Error} error - Original error
   * @param {string} registration - Vehicle registration number
   * @throws {Error} Formatted error
   */
  handleError(error, registration) {
    const errorDetails = {
      registration,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    };

    // Log error details
    console.error('CheckCarDetails API error:', errorDetails);

    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;

      if (status === 403) {
        console.warn('CheckCarDetails API rate limit or forbidden access');
        const rateLimitError = new Error('CheckCarDetails API rate limit exceeded or access forbidden');
        rateLimitError.code = 'RATE_LIMIT_EXCEEDED';
        rateLimitError.userMessage = 'Unable to fetch vehicle data at this time. Please try again later.';
        throw rateLimitError;
      }

      if (status === 404) {
        const notFoundError = new Error(`Vehicle not found: ${registration}`);
        notFoundError.code = 'VEHICLE_NOT_FOUND';
        notFoundError.userMessage = 'Vehicle data not available for this registration number.';
        throw notFoundError;
      }

      if (status === 400) {
        const badRequestError = new Error(`Invalid request for vehicle: ${registration}`);
        badRequestError.code = 'BAD_REQUEST';
        badRequestError.userMessage = 'Invalid vehicle registration number format.';
        throw badRequestError;
      }
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const timeoutError = new Error('CheckCarDetails API request timeout');
      timeoutError.code = 'API_TIMEOUT';
      timeoutError.userMessage = 'Request timed out. Please try again.';
      throw timeoutError;
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const networkError = new Error('CheckCarDetails API network error');
      networkError.code = 'NETWORK_ERROR';
      networkError.userMessage = 'Unable to connect to vehicle data service.';
      throw networkError;
    }

    // Generic error
    const genericError = new Error(`CheckCarDetails API call failed for ${registration}: ${error.message}`);
    genericError.code = 'API_ERROR';
    genericError.originalError = error;
    genericError.details = errorDetails;
    genericError.userMessage = 'Unable to fetch vehicle data. Please try again.';
    throw genericError;
  }

  /**
   * Get comprehensive vehicle data from CheckCarDetails API
   * Fetches data from both Vehiclespecs and UKVehicleData endpoints for complete information
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle data including running costs, color, and previous owners
   * @throws {Error} If API call fails or data is invalid
   */
  async getVehicleData(registration) {
    // Validate API key
    this.validateApiKey();

    // Validate VRM
    this.validateVRM(registration);

    try {
      // Fetch both Vehicle Specs and UK Vehicle Data in parallel
      const [specsResult, ukDataResult] = await Promise.allSettled([
        this.getVehicleSpecs(registration),
        this.getUKVehicleData(registration)
      ]);

      // Get specs data (main source for technical details)
      const specsData = specsResult.status === 'fulfilled' ? specsResult.value : null;
      
      // Get UK data (source for color and previous owners)
      const ukData = ukDataResult.status === 'fulfilled' ? ukDataResult.value : null;

      // Parse specs response using utility
      const parsedData = specsData ? ApiResponseParser.parseCheckCarDetailsResponse(specsData) : {};

      // Add color from UK Vehicle Data
      if (ukData?.VehicleRegistration?.Colour) {
        parsedData.color = ukData.VehicleRegistration.Colour;
      }

      // Add previous owners from UK Vehicle Data
      if (ukData?.VehicleHistory?.NumberOfPreviousKeepers !== undefined) {
        parsedData.previousOwners = ukData.VehicleHistory.NumberOfPreviousKeepers;
      }

      // Add gearbox information from specs data
      if (specsData?.Transmission?.NumberOfGears || ukData?.VehicleRegistration?.GearCount) {
        parsedData.gearbox = specsData?.Transmission?.NumberOfGears || ukData?.VehicleRegistration?.GearCount;
      }

      // Add emission class (Euro status) from specs data
      if (specsData?.ModelData?.EuroStatus || ukData?.General?.EuroStatus) {
        const euroStatus = specsData?.ModelData?.EuroStatus || ukData?.General?.EuroStatus;
        parsedData.emissionClass = `Euro ${euroStatus}`;
      }

      console.log(`CheckCarDetails data parsed successfully for ${registration}`);
      return parsedData;

    } catch (error) {
      // Handle and format error
      this.handleError(error, registration);
    }
  }

  /**
   * Get vehicle data with valuation
   * Fetches both vehicle data and valuation pricing
   * @param {string} registration - Vehicle registration number
   * @returns {Promise<Object>} Vehicle data with valuation
   */
  async getVehicleDataWithValuation(registration) {
    // Validate API key
    this.validateApiKey();

    // Validate VRM
    this.validateVRM(registration);

    try {
      // Fetch both vehicle data and valuation in parallel
      const [vehicleData, valuationData] = await Promise.allSettled([
        this.getUKVehicleData(registration),
        this.getVehicleValuation(registration)
      ]);

      // Parse vehicle data using utility
      const parsedVehicleData = vehicleData.status === 'fulfilled' 
        ? ApiResponseParser.parseCheckCarDetailsResponse(vehicleData.value)
        : {};

      // Parse valuation data using utility
      const parsedValuation = valuationData.status === 'fulfilled'
        ? ApiResponseParser.parseValuationResponse(valuationData.value)
        : null;

      // Merge data
      return {
        ...parsedVehicleData,
        valuation: parsedValuation
      };

    } catch (error) {
      this.handleError(error, registration);
    }
  }

  /**
   * Parse valuation response - delegates to ApiResponseParser utility
   * @param {Object} data - Raw valuation API response
   * @returns {Object} Parsed valuation data
   * @deprecated Use ApiResponseParser.parseValuationResponse() directly
   */
  parseValuationResponse(data) {
    return ApiResponseParser.parseValuationResponse(data);
  }
}

module.exports = CheckCarDetailsClient;
