/**
 * CheckCarDetails API Client
 * Handles communication with the CheckCarDetails API for vehicle data
 * API Documentation: https://api.checkcardetails.co.uk
 * Endpoint format: /vehicledata/{Datapoint}?apikey={API_KEY}&vrm={Registration}
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
    
    // Data point costs (in GBP)
    this.dataPointCosts = {
      vehicleregistration: 0.02,
      ukvehicledata: 0.10,
      vehiclespecs: 0.04,
      carhistorycheck: 1.82,
      mot: 0.02,
      mileage: 0.02,
      vehicleimage: 0.05,
      vehiclevaluation: 0.12
    };
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
   * CheckCardDetails API format: /vehicledata/{datapoint}?apikey={API_KEY}&vrm={Registration}
   * @param {string} datapoint - API data point (e.g., 'carhistorycheck', 'mot', 'mileage')
   * @param {string} vrm - Vehicle Registration Mark
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async makeRequestWithRetry(datapoint, vrm, attempt = 1) {
    try {
      console.log(`Calling CheckCarDetails API: ${datapoint} for VRM ${vrm} (attempt ${attempt})`);
      
      const response = await axios.get(
        `${this.baseUrl}/vehicledata/${datapoint}`,
        {
          params: {
            apikey: this.apiKey,
            vrm: vrm.toUpperCase(),
          },
          timeout: this.timeout,
        }
      );

      console.log(`API call successful: ${datapoint} (cost: £${this.dataPointCosts[datapoint] || 'unknown'})`);
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
        console.log(`API retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(datapoint, vrm, attempt + 1);
      }

      // No more retries, throw error
      throw error;
    }
  }

  /**
   * Get vehicle registration details
   * Data point: vehicleregistration (£0.02)
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Vehicle registration data
   */
  async getVehicleRegistration(vrm) {
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    if (this.isTestMode && !this.validateTestVRM(vrm)) {
      throw new Error('Invalid VRM for test mode: VRM must contain the letter "A"');
    }

    try {
      const apiResponse = await this.makeRequestWithRetry('vehicleregistration', vrm);
      return this.parseVehicleRegistrationResponse(apiResponse);
    } catch (error) {
      throw this.formatError(error, vrm, 'vehicleregistration');
    }
  }

  /**
   * Get vehicle specifications
   * Data point: vehiclespecs (£0.04)
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Vehicle specifications
   */
  async getVehicleSpecs(vrm) {
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    if (this.isTestMode && !this.validateTestVRM(vrm)) {
      throw new Error('Invalid VRM for test mode: VRM must contain the letter "A"');
    }

    try {
      const apiResponse = await this.makeRequestWithRetry('vehiclespecs', vrm);
      return this.parseVehicleSpecsResponse(apiResponse);
    } catch (error) {
      throw this.formatError(error, vrm, 'vehiclespecs');
    }
  }

  /**
   * Get vehicle mileage history
   * Data point: mileage (£0.02)
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} Mileage history
   */
  async getMileageHistory(vrm) {
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    if (this.isTestMode && !this.validateTestVRM(vrm)) {
      throw new Error('Invalid VRM for test mode: VRM must contain the letter "A"');
    }

    try {
      const apiResponse = await this.makeRequestWithRetry('mileage', vrm);
      return this.parseMileageResponse(apiResponse);
    } catch (error) {
      throw this.formatError(error, vrm, 'mileage');
    }
  }

  /**
   * Check vehicle history using ukvehicledata endpoint
   * Data point: ukvehicledata (£0.10)
   * This endpoint provides comprehensive vehicle data including history
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
      // Use carhistorycheck endpoint which includes write-off data
      // This endpoint provides comprehensive vehicle history including write-offs
      const apiResponse = await this.makeRequestWithRetry('carhistorycheck', vrm);
      
      // Parse the carhistorycheck response using historyResponseParser
      const { parseHistoryResponse } = require('../utils/historyResponseParser');
      
      try {
        const parsedResult = parseHistoryResponse(apiResponse, this.isTestMode);
        return parsedResult;
      } catch (parseError) {
        console.warn('Failed to parse complete response, attempting partial parse');
        const partialResult = handlePartialResponse(apiResponse, this.isTestMode);
        return partialResult;
      }
    } catch (error) {
      throw this.formatError(error, vrm, 'carhistorycheck');
    }
  }

  /**
   * Get MOT history for a vehicle
   * Data point: mot (£0.02)
   * @param {string} vrm - Vehicle Registration Mark
   * @returns {Promise<Object>} MOT history data
   * @throws {Error} If VRM is invalid or API call fails
   */
  async getMOTHistory(vrm) {
    // Validate VRM
    if (!vrm || typeof vrm !== 'string') {
      throw new Error('Invalid VRM: must be a non-empty string');
    }

    if (this.isTestMode && !this.validateTestVRM(vrm)) {
      throw new Error('Invalid VRM for test mode: VRM must contain the letter "A"');
    }

    try {
      console.log(`Fetching MOT history from CheckCarDetails API for VRM: ${vrm}`);
      const apiResponse = await this.makeRequestWithRetry('mot', vrm);
      
      console.log('MOT API response received');
      return this.parseMOTResponse(apiResponse);
    } catch (error) {
      console.log('CheckCarDetails MOT endpoint error:', error.message);
      throw this.formatError(error, vrm, 'mot');
    }
  }

  /**
   * Format error with context
   * @param {Error} error - Original error
   * @param {string} vrm - Vehicle Registration Mark
   * @param {string} datapoint - API data point
   * @returns {Error} Formatted error
   */
  formatError(error, vrm, datapoint) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      vrm,
      datapoint,
      isTestMode: this.isTestMode,
    };

    console.error(`CheckCarDetails API call failed (${datapoint}):`, errorDetails);
    
    // Check for 403 Forbidden (daily limit exceeded)
    if (error.response?.status === 403) {
      const apiMessage = error.response?.data?.message || '';
      if (apiMessage.includes('daily limit')) {
        const enhancedError = new Error(
          `Daily API limit exceeded for ${datapoint}. Vehicle history data is temporarily unavailable.`
        );
        enhancedError.originalError = error;
        enhancedError.details = errorDetails;
        enhancedError.isDailyLimitError = true;
        enhancedError.userMessage = 'Vehicle history check is temporarily unavailable. Please try again later or contact the seller for vehicle history information.';
        return enhancedError;
      }
    }
    
    const enhancedError = new Error(
      `CheckCarDetails API ${datapoint} failed for VRM ${vrm}: ${error.message}`
    );
    enhancedError.originalError = error;
    enhancedError.details = errorDetails;
    return enhancedError;
  }

  /**
   * Parse UK Vehicle Data response (comprehensive data)
   * @param {Object} data - API response data
   * @returns {Object} Parsed history data
   */
  parseUKVehicleDataResponse(data) {
    const vehicleReg = data.VehicleRegistration || {};
    const vehicleHistory = data.VehicleHistory || {};
    
    // Extract previous keepers - try multiple possible field names
    let numberOfPreviousKeepers = 0;
    if (vehicleHistory.NumberOfPreviousKeepers !== undefined && vehicleHistory.NumberOfPreviousKeepers !== null) {
      numberOfPreviousKeepers = parseInt(vehicleHistory.NumberOfPreviousKeepers) || 0;
    } else if (vehicleHistory.PreviousKeepers !== undefined && vehicleHistory.PreviousKeepers !== null) {
      numberOfPreviousKeepers = parseInt(vehicleHistory.PreviousKeepers) || 0;
    } else if (vehicleHistory.numberOfPreviousKeepers !== undefined && vehicleHistory.numberOfPreviousKeepers !== null) {
      numberOfPreviousKeepers = parseInt(vehicleHistory.numberOfPreviousKeepers) || 0;
    } else if (data.numberOfPreviousKeepers !== undefined && data.numberOfPreviousKeepers !== null) {
      numberOfPreviousKeepers = parseInt(data.numberOfPreviousKeepers) || 0;
    } else if (data.PreviousKeepers !== undefined && data.PreviousKeepers !== null) {
      numberOfPreviousKeepers = parseInt(data.PreviousKeepers) || 0;
    }
    
    console.log('📊 Previous Keepers Data:', {
      raw: vehicleHistory.NumberOfPreviousKeepers,
      parsed: numberOfPreviousKeepers,
      vehicleHistory: vehicleHistory
    });
    
    // Extract make and model - try multiple possible field names
    let make = 'Unknown';
    let model = 'Unknown';
    
    // Try different field names for make
    if (vehicleReg.Make) {
      make = vehicleReg.Make;
    } else if (vehicleReg.make) {
      make = vehicleReg.make;
    } else if (data.Make) {
      make = data.Make;
    } else if (data.make) {
      make = data.make;
    }
    
    // Try different field names for model
    if (vehicleReg.Model) {
      model = vehicleReg.Model;
    } else if (vehicleReg.model) {
      model = vehicleReg.model;
    } else if (vehicleReg.ModelLiteral) {
      model = vehicleReg.ModelLiteral;
    } else if (vehicleReg.ModelDescription) {
      model = vehicleReg.ModelDescription;
    } else if (data.Model) {
      model = data.Model;
    } else if (data.model) {
      model = data.model;
    } else if (data.ModelLiteral) {
      model = data.ModelLiteral;
    }
    
    console.log('🚗 Make/Model Data:', {
      makeRaw: vehicleReg.Make,
      modelRaw: vehicleReg.Model,
      makeParsed: make,
      modelParsed: model,
      allVehicleRegFields: Object.keys(vehicleReg)
    });
    
    return {
      vrm: vehicleReg.Vrm || vehicleReg.PreviousVrmGb || data.vrm,
      make: make,
      model: model,
      colour: vehicleReg.Colour || data.colour,
      fuelType: vehicleReg.FuelType || data.fuelType,
      yearOfManufacture: vehicleReg.YearOfManufacture || data.yearOfManufacture,
      firstRegistered: vehicleReg.DateFirstRegisteredUk || vehicleReg.DateFirstRegistered,
      engineCapacity: vehicleReg.EngineCapacity,
      bodyType: vehicleReg.DoorPlanLiteral || data.bodyType,
      transmission: vehicleReg.Transmission || vehicleReg.TransmissionType,
      
      // History information - use the extracted value
      numberOfPreviousKeepers: numberOfPreviousKeepers,
      previousOwners: numberOfPreviousKeepers, // Add this for compatibility
      numberOfOwners: numberOfPreviousKeepers, // Add this for compatibility
      plateChanges: parseInt(vehicleHistory.PlateChangeCount) || 0,
      colourChanges: parseInt(vehicleHistory.ColourChangeCount) || 0,
      exported: vehicleReg.Exported || false,
      scrapped: vehicleReg.Scrapped || false,
      imported: vehicleReg.Imported || false,
      
      // Additional details
      vin: vehicleReg.Vin,
      engineNumber: vehicleReg.EngineNumber,
      co2Emissions: vehicleReg.Co2Emissions,
      
      // History checks - CRITICAL: Extract write-off and other history data
      hasAccidentHistory: Boolean(vehicleHistory.writeOffRecord || vehicleHistory.writeoff),
      isStolen: Boolean(vehicleHistory.stolenRecord || vehicleHistory.stolen),
      isScrapped: Boolean(vehicleReg.Scrapped),
      isImported: Boolean(vehicleReg.Imported || vehicleReg.ImportNonEu),
      isExported: Boolean(vehicleReg.Exported),
      isWrittenOff: Boolean(vehicleHistory.writeOffRecord || vehicleHistory.writeoff),
      hasOutstandingFinance: Boolean(vehicleHistory.financeRecord || vehicleHistory.finance),
      
      // Accident/Write-off details
      accidentDetails: (vehicleHistory.writeOffRecord && vehicleHistory.writeoff) ? {
        count: 1,
        severity: vehicleHistory.writeoff.category || 
                 (vehicleHistory.writeoff.status?.includes('CAT D') ? 'D' :
                  vehicleHistory.writeoff.status?.includes('CAT C') ? 'C' :
                  vehicleHistory.writeoff.status?.includes('CAT B') ? 'B' :
                  vehicleHistory.writeoff.status?.includes('CAT A') ? 'A' :
                  vehicleHistory.writeoff.status?.includes('CAT S') ? 'S' :
                  vehicleHistory.writeoff.status?.includes('CAT N') ? 'N' : 'unknown'),
        dates: vehicleHistory.writeoff.lossdate ? [new Date(vehicleHistory.writeoff.lossdate)] : []
      } : {
        count: 0,
        severity: 'unknown',
        dates: []
      },
      
      // Stolen details
      stolenDetails: (vehicleHistory.stolenRecord && vehicleHistory.stolen) ? {
        reportedDate: vehicleHistory.stolen.date ? new Date(vehicleHistory.stolen.date) : new Date(),
        status: vehicleHistory.stolen.status || 'active'
      } : {
        status: 'active'
      },
      
      // Finance details
      financeDetails: (vehicleHistory.financeRecord && vehicleHistory.finance) ? {
        amount: vehicleHistory.finance.amount || 0,
        lender: vehicleHistory.finance.lender || 'Unknown',
        type: vehicleHistory.finance.type || 'unknown'
      } : {
        amount: 0,
        lender: 'Unknown',
        type: 'unknown'
      },
      
      // Additional fields for compatibility
      numberOfKeys: 1,
      keys: 1,
      serviceHistory: 'Contact seller',
      checkStatus: 'success',
      apiProvider: 'unknown',
      testMode: this.isTestMode,
      checkDate: new Date(),
      
      // History lists
      keeperChanges: vehicleHistory.KeeperChangesList || [],
      plateChangeList: vehicleHistory.PlateChangeList || [],
      colourChangeList: vehicleHistory.ColourChangeList || [],
    };
  }

  /**
   * Parse vehicle registration response
   * @param {Object} data - API response data
   * @returns {Object} Parsed registration data
   */
  parseVehicleRegistrationResponse(data) {
    return {
      vrm: data.registrationNumber || data.RegistrationNumber || data.vrm,
      make: data.make || data.Make,
      model: data.model || data.Model,
      colour: data.colour || data.Colour,
      fuelType: data.fuelType || data.FuelType,
      yearOfManufacture: data.yearOfManufacture || data.YearOfManufacture,
      engineCapacity: data.engineCapacity || data.EngineCapacity,
      co2Emissions: data.co2Emissions || data.Co2Emissions,
      taxStatus: data.tax?.taxStatus || data.TaxStatus || data.taxStatus,
      taxDueDate: data.tax?.taxDueDate || data.TaxDueDate || data.taxDueDate,
      motStatus: data.mot?.motStatus || data.MotStatus || data.motStatus,
      motExpiryDate: data.mot?.motDueDate || data.MotExpiryDate || data.motExpiryDate,
    };
  }

  /**
   * Parse vehicle specifications response
   * @param {Object} data - API response data
   * @returns {Object} Parsed specifications
   */
  parseVehicleSpecsResponse(data) {
    const vehicleId = data.VehicleIdentification || {};
    const modelData = data.ModelData || {};
    const bodyDetails = data.BodyDetails || {};
    const transmission = data.Transmission || {};
    const performance = data.Performance || {};
    
    return {
      vrm: vehicleId.Vrm || data.RegistrationNumber || data.vrm,
      make: vehicleId.DvlaMake || modelData.Make || data.Make || data.make,
      model: vehicleId.DvlaModel || modelData.Model || data.Model || data.model,
      bodyType: vehicleId.DvlaBodyType || bodyDetails.BodyStyle || data.BodyType || data.bodyType,
      transmission: transmission.TransmissionType || data.Transmission || data.transmission,
      engineSize: data.PowerSource?.IceDetails?.EngineCapacityCc || data.EngineSize || data.engineSize,
      fuelType: vehicleId.DvlaFuelType || modelData.FuelType || data.FuelType || data.fuelType,
      doors: bodyDetails.NumberOfDoors || data.Doors || data.doors,
      seats: bodyDetails.NumberOfSeats || data.Seats || data.seats,
      wheelPlan: vehicleId.DvlaWheelPlan || data.WheelPlan || data.wheelPlan,
      weight: data.Weights?.KerbWeightKg || data.Weight || data.weight,
      maxPower: performance.Power?.Bhp || data.MaxPower || data.maxPower,
      topSpeed: performance.Statistics?.MaxSpeedMph || data.TopSpeed || data.topSpeed,
      acceleration: performance.Statistics?.ZeroToSixtyMph || data.Acceleration || data.acceleration,
    };
  }

  /**
   * Parse mileage history response
   * @param {Object} data - API response data
   * @returns {Object} Parsed mileage history
   */
  parseMileageResponse(data) {
    // CheckCarDetails returns mileage array
    const readings = data.mileage || data.MileageReadings || data.mileageReadings || [];
    
    return {
      vrm: data.registrationNumber || data.RegistrationNumber || data.vrm,
      currentMileage: data.summary?.lastRecordedMileage || data.CurrentMileage || data.currentMileage,
      readings: readings.map(reading => ({
        mileage: reading.mileage || reading.Mileage,
        date: reading.dateOfInformation || reading.Date || reading.date,
        source: reading.source || reading.Source || 'Unknown',
      })),
      hasDiscrepancy: data.summary?.mileageIssues === 'Yes' || this.detectMileageDiscrepancy(readings),
    };
  }

  /**
   * Detect mileage discrepancies
   * @param {Array} readings - Mileage readings
   * @returns {boolean} True if discrepancy detected
   */
  detectMileageDiscrepancy(readings) {
    if (!readings || readings.length < 2) return false;
    
    for (let i = 1; i < readings.length; i++) {
      const current = readings[i].Mileage || readings[i].mileage;
      const previous = readings[i - 1].Mileage || readings[i - 1].mileage;
      
      if (current < previous) {
        return true; // Mileage went down
      }
    }
    
    return false;
  }

  /**
   * Parse MOT response from CheckCarDetails API
   * @param {Object} data - API response data
   * @returns {Object} Parsed MOT history
   */
  parseMOTResponse(data) {
    // CheckCarDetails returns motHistory array
    const tests = data.motHistory || data.MotTests || data.motTests || data.tests || [];
    
    return {
      vrm: data.registrationNumber || data.RegistrationNumber || data.vrm || data.registration,
      currentStatus: data.mot?.motStatus || data.MotStatus || data.motStatus || 'Unknown',
      expiryDate: data.mot?.motDueDate || data.MotExpiryDate || data.motExpiryDate || data.expiryDate,
      tests: tests.map(test => ({
        testDate: test.completedDate || test.CompletedDate || test.testDate,
        testNumber: test.motTestNumber || test.MotTestNumber || test.testNumber,
        result: test.testResult || test.TestResult || test.result,
        expiryDate: test.expiryDate || test.ExpiryDate,
        odometerValue: test.odometerValue || test.OdometerValue,
        odometerUnit: test.odometerUnit || test.OdometerUnit || 'mi',
        rfrAndComments: test.rfrAndComments || test.RfrAndComments || [],
        defects: test.defects || test.Defects || [],
        advisoryNotices: test.advisoryNotices || test.AdvisoryNotices || test.minorDefects || [],
      })),
    };
  }

}

module.exports = HistoryAPIClient;
