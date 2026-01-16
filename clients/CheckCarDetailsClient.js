/**
 * CheckCarDetails API Client
 * Handles communication with CheckCarDetails API for running costs data
 * API Documentation: https://api.checkcardetails.co.uk
 */

const axios = require('axios');

class CheckCarDetailsClient {
  constructor() {
    this.baseURL = process.env.CHECKCARD_API_BASE_URL || 'https://api.checkcardetails.co.uk';
    this.apiKey = process.env.API_ENVIRONMENT === 'production' 
      ? process.env.CHECKCARD_API_KEY 
      : (process.env.CHECKCARD_API_TEST_KEY || process.env.CHECKCARD_API_KEY);
    this.isTestMode = process.env.API_ENVIRONMENT !== 'production';
    this.timeout = 10000; // 10 seconds
    this.maxRetries = 2; // Retry once on failure
    
    // Log configuration (without exposing full API key)
    const keyPreview = this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET';
    console.log(`CheckCarDetails Client initialized: ${this.isTestMode ? 'TEST' : 'PRODUCTION'} mode, API Key: ${keyPreview}`);
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
   * Parse API response and extract running costs data
   * Updated to handle actual CheckCarDetails API response structure
   * @param {Object} data - Raw API response
   * @returns {Object} Parsed vehicle data
   */
  parseResponse(data) {
    // Handle different response structures
    const smmtDetails = data.SmmtDetails || {};
    const performance = data.Performance || {};
    const emissions = data.Emissions || {};
    const modelData = data.ModelData || {};
    const vehicleExcise = data.VehicleExciseDutyDetails || {};
    const vehicleId = data.VehicleIdentification || {};
    const bodyDetails = data.BodyDetails || {};

    // Extract fuel economy data
    const fuelEconomy = {
      urban: this.extractNumber(
        performance.FuelEconomy?.UrbanColdMpg || 
        smmtDetails.UrbanColdMpg || 
        data.FuelConsumptionUrban || 
        data.fuelEconomy?.urban
      ),
      extraUrban: this.extractNumber(
        performance.FuelEconomy?.ExtraUrbanMpg || 
        smmtDetails.ExtraUrbanMpg || 
        data.FuelConsumptionExtraUrban || 
        data.fuelEconomy?.extraUrban
      ),
      combined: this.extractNumber(
        performance.FuelEconomy?.CombinedMpg || 
        smmtDetails.CombinedMpg || 
        data.FuelConsumptionCombined || 
        data.fuelEconomy?.combined
      )
    };

    // Extract emissions and tax data
    const co2Emissions = this.extractNumber(
      emissions.ManufacturerCo2 || 
      smmtDetails.Co2 || 
      vehicleExcise.DvlaCo2 || 
      data.Co2Emissions || 
      data.co2Emissions
    );

    const insuranceGroup = data.InsuranceGroup || data.insuranceGroup || null;

    // Extract annual tax from VED rates
    const annualTax = this.extractNumber(
      vehicleExcise.VedRate?.Standard?.TwelveMonths ||
      data.AnnualTax || 
      data.annualTax || 
      data.TaxRate
    );

    // Extract performance data
    const performanceData = {
      power: this.extractNumber(
        performance.Power?.Bhp || 
        smmtDetails.PowerBhp || 
        data.Power || 
        data.power || 
        data.EnginePower
      ),
      torque: this.extractNumber(
        performance.Torque?.Nm || 
        smmtDetails.TorqueNm || 
        data.Torque || 
        data.torque
      ),
      acceleration: this.extractNumber(
        performance.Statistics?.ZeroToSixtyMph || 
        smmtDetails.ZeroToSixtyMph || 
        data.Acceleration || 
        data.acceleration || 
        data.ZeroToSixty
      ),
      topSpeed: this.extractNumber(
        performance.Statistics?.MaxSpeedMph || 
        smmtDetails.MaxSpeedMph || 
        data.TopSpeed || 
        data.topSpeed || 
        data.MaxSpeed
      )
    };

    // Extract basic vehicle data
    const basicData = {
      make: vehicleId.DvlaMake || modelData.Make || smmtDetails.Make || data.Make || data.make || null,
      model: vehicleId.DvlaModel || modelData.Model || smmtDetails.Model || data.Model || data.model || null,
      year: this.extractNumber(
        vehicleId.YearOfManufacture || 
        modelData.StartDate?.substring(0, 4) || 
        data.Year || 
        data.year || 
        data.YearOfManufacture
      ),
      fuelType: this.normalizeFuelType(vehicleId.DvlaFuelType || modelData.FuelType || smmtDetails.FuelType || data.FuelType || data.fuelType),
      transmission: data.Transmission?.TransmissionType || smmtDetails.Transmission || data.Transmission || data.transmission || null,
      engineSize: this.extractNumber(
        data.DvlaTechnicalDetails?.EngineCapacityCc || 
        smmtDetails.EngineCapacity || 
        data.EngineSize || 
        data.engineSize || 
        data.EngineCapacity
      ),
      // NEW: Extract body type from VehicleIdentification
      bodyType: vehicleId.DvlaBodyType || bodyDetails.BodyStyle || smmtDetails.BodyStyle || data.BodyType || null,
      // NEW: Extract doors from BodyDetails
      doors: this.extractNumber(
        bodyDetails.NumberOfDoors || 
        smmtDetails.NumberOfDoors || 
        data.NumberOfDoors || 
        data.doors
      ),
      // NEW: Extract seats
      seats: this.extractNumber(
        bodyDetails.NumberOfSeats ||
        data.DvlaTechnicalDetails?.SeatCountIncludingDriver ||
        smmtDetails.NumberOfSeats ||
        data.NumberOfSeats ||
        data.seats
      )
    };

    return {
      fuelEconomy,
      co2Emissions,
      insuranceGroup,
      annualTax,
      performance: performanceData,
      ...basicData
    };
  }

  /**
   * Normalize fuel type to standard format
   * @param {string} fuelType - Raw fuel type from API
   * @returns {string|null} Normalized fuel type
   */
  normalizeFuelType(fuelType) {
    if (!fuelType) return null;

    const normalized = fuelType.toUpperCase().trim();

    // Map DVLA fuel types to standard names
    const fuelTypeMap = {
      'HEAVY OIL': 'Diesel',
      'DIESEL': 'Diesel',
      'PETROL': 'Petrol',
      'ELECTRICITY': 'Electric',
      'ELECTRIC': 'Electric',
      'HYBRID ELECTRIC': 'Hybrid',
      'HYBRID': 'Hybrid',
      'PLUG-IN HYBRID': 'Plug-in Hybrid',
      'LPG': 'LPG',
      'CNG': 'CNG',
      'HYDROGEN': 'Hydrogen'
    };

    return fuelTypeMap[normalized] || fuelType;
  }

  /**
   * Extract numeric value from various formats
   * @param {*} value - Value to extract number from
   * @returns {number|null} Extracted number or null
   */
  extractNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // If already a number
    if (typeof value === 'number') {
      return value;
    }

    // If string, try to parse
    if (typeof value === 'string') {
      // Remove common units and non-numeric characters
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
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

      // Parse specs response
      const parsedData = specsData ? this.parseResponse(specsData) : {};

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

      // Parse vehicle data
      const parsedVehicleData = vehicleData.status === 'fulfilled' 
        ? this.parseResponse(vehicleData.value)
        : {};

      // Parse valuation data
      const parsedValuation = valuationData.status === 'fulfilled'
        ? this.parseValuationResponse(valuationData.value)
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
   * Parse valuation response
   * Updated to handle actual CheckCarDetails valuation API response
   * @param {Object} data - Raw valuation API response
   * @returns {Object} Parsed valuation data
   */
  parseValuationResponse(data) {
    const valuationList = data.ValuationList || {};
    
    return {
      dealerPrice: this.extractNumber(valuationList.DealerForecourt || data.DealerForecourt || data.dealerPrice),
      privatePrice: this.extractNumber(valuationList.PrivateClean || data.PrivateClean || data.privatePrice),
      partExchangePrice: this.extractNumber(valuationList.PartExchange || data.PartExchange || data.partExchangePrice),
      tradePrice: this.extractNumber(valuationList.TradeAverage || data.TradeAverage || data.tradePrice),
      auctionPrice: this.extractNumber(valuationList.Auction || data.Auction),
      otrPrice: this.extractNumber(valuationList.OTR || data.OTR),
      mileage: data.Mileage || null,
      vehicleDescription: data.VehicleDescription || null,
      valuationDate: data.ValuationTime || data.ValuationDate || data.valuationDate || new Date().toISOString()
    };
  }
}

module.exports = new CheckCarDetailsClient();
