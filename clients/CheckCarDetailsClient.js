/**
 * CheckCarDetails API Client
 * Handles communication with CheckCarDetails API for running costs data
 * API Documentation: https://api.checkcardetails.co.uk
 */

const axios = require('axios');
const vehicleFormatter = require('../utils/vehicleFormatter');

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
   * Parse API response and extract ALL available vehicle data automatically
   * Updated to handle actual CheckCarDetails API response structure
   * @param {Object} data - Raw API response
   * @returns {Object} Parsed vehicle data with ALL available fields
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
    const dimensions = data.Dimensions || {};
    const weights = data.Weights || {};
    const powerSource = data.PowerSource || {};
    const transmission = data.Transmission || {};
    const dvlaTech = data.DvlaTechnicalDetails || {};

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

    // Extract electric vehicle specific data
    const electricVehicleData = {
      electricRange: this.extractNumber(
        powerSource.ElectricDetails?.RangeMiles ||
        powerSource.ElectricDetails?.Range ||
        data.ElectricRange ||
        data.electricRange ||
        data.RangeMiles ||
        data.Range
      ),
      batteryCapacity: this.extractNumber(
        powerSource.ElectricDetails?.BatteryCapacityKwh ||
        powerSource.ElectricDetails?.BatteryCapacity ||
        data.BatteryCapacityKwh ||
        data.batteryCapacity ||
        data.BatteryCapacity
      ),
      chargingTime: this.extractNumber(
        powerSource.ElectricDetails?.ChargingTimeHours ||
        powerSource.ElectricDetails?.ChargingTime ||
        data.ChargingTimeHours ||
        data.chargingTime ||
        data.ChargingTime
      ),
      // Additional electric vehicle fields
      electricMotorPower: this.extractNumber(
        powerSource.ElectricDetails?.MotorPowerKw ||
        data.ElectricMotorPower ||
        data.MotorPowerKw
      ),
      electricMotorTorque: this.extractNumber(
        powerSource.ElectricDetails?.MotorTorqueNm ||
        data.ElectricMotorTorque ||
        data.MotorTorqueNm
      ),
      chargingPortType: powerSource.ElectricDetails?.ChargingPortType || data.ChargingPortType || null,
      fastChargingCapability: powerSource.ElectricDetails?.FastChargingCapability || data.FastChargingCapability || null
    };

    // Extract performance data
    const performanceData = {
      power: this.extractNumber(
        performance.Power?.Bhp || 
        smmtDetails.PowerBhp || 
        data.Power || 
        data.power || 
        data.EnginePower
      ),
      powerKw: this.extractNumber(
        performance.Power?.Kw || 
        smmtDetails.PowerKw || 
        data.PowerKw
      ),
      powerPs: this.extractNumber(
        performance.Power?.Ps || 
        smmtDetails.PowerPs || 
        data.PowerPs
      ),
      torque: this.extractNumber(
        performance.Torque?.Nm || 
        smmtDetails.TorqueNm || 
        data.Torque || 
        data.torque
      ),
      torqueLbFt: this.extractNumber(
        performance.Torque?.LbFt || 
        smmtDetails.TorqueLbFt || 
        data.TorqueLbFt
      ),
      torqueRpm: this.extractNumber(
        performance.Torque?.Rpm || 
        smmtDetails.TorqueRpm || 
        data.TorqueRpm
      ),
      acceleration: this.extractNumber(
        performance.Statistics?.ZeroToSixtyMph || 
        smmtDetails.ZeroToSixtyMph || 
        data.Acceleration || 
        data.acceleration || 
        data.ZeroToSixty
      ),
      zeroToOneHundredKph: this.extractNumber(
        performance.Statistics?.ZeroToOneHundredKph || 
        data.ZeroToOneHundredKph
      ),
      topSpeed: this.extractNumber(
        performance.Statistics?.MaxSpeedMph || 
        smmtDetails.MaxSpeedMph || 
        data.TopSpeed || 
        data.topSpeed || 
        data.MaxSpeed
      ),
      topSpeedKph: this.extractNumber(
        performance.Statistics?.MaxSpeedKph || 
        smmtDetails.MaxSpeedKph || 
        data.MaxSpeedKph
      )
    };

    // Extract basic vehicle data
    const basicData = {
      make: vehicleId.DvlaMake || modelData.Make || smmtDetails.Marque || smmtDetails.Make || data.Make || data.make || null,
      model: modelData.Range || vehicleId.DvlaModel || modelData.Model || smmtDetails.Range || smmtDetails.Model || data.Model || data.model || null,
      modelVariant: modelData.ModelVariant || smmtDetails.Variant || data.ModelVariant || data.modelVariant || null,
      series: modelData.Series || smmtDetails.Series || data.Series || null,
      year: this.extractNumber(
        vehicleId.YearOfManufacture || 
        modelData.StartDate?.substring(0, 4) || 
        data.Year || 
        data.year || 
        data.YearOfManufacture
      ),
      fuelType: this.normalizeFuelType(vehicleId.DvlaFuelType || modelData.FuelType || smmtDetails.FuelType || data.FuelType || data.fuelType),
      transmission: transmission.TransmissionType || smmtDetails.Transmission || data.Transmission || data.transmission || null,
      numberOfGears: this.extractNumber(
        transmission.NumberOfGears || 
        smmtDetails.NumberOfGears || 
        data.NumberOfGears
      ),
      driveType: transmission.DriveType || smmtDetails.DriveType || data.DriveType || null,
      drivingAxle: transmission.DrivingAxle || smmtDetails.DrivingAxle || data.DrivingAxle || null,
      engineSize: this.extractNumber(
        // Prefer litres, otherwise convert cc to litres
        powerSource.IceDetails?.EngineCapacityLitres ||
        smmtDetails.NominalEngineCapacity ||
        data.EngineCapacityLitres ||
        (dvlaTech.EngineCapacityCc ? (dvlaTech.EngineCapacityCc / 1000) : null) ||
        (powerSource.IceDetails?.EngineCapacityCc ? (powerSource.IceDetails.EngineCapacityCc / 1000) : null) ||
        (smmtDetails.EngineCapacity ? (smmtDetails.EngineCapacity / 1000) : null) ||
        (data.EngineSize ? (typeof data.EngineSize === 'number' && data.EngineSize > 100 ? data.EngineSize / 1000 : data.EngineSize) : null)
      ),
      engineSizeLitres: this.extractNumber(
        powerSource.IceDetails?.EngineCapacityLitres ||
        smmtDetails.NominalEngineCapacity ||
        data.EngineCapacityLitres
      ),
      engineDescription: powerSource.IceDetails?.EngineDescription || smmtDetails.EngineDescription || data.EngineDescription || null,
      engineManufacturer: powerSource.IceDetails?.EngineManufacturer || smmtDetails.EngineMake || data.EngineManufacturer || null,
      engineLocation: powerSource.IceDetails?.EngineLocation || smmtDetails.EngineLocation || data.EngineLocation || null,
      numberOfCylinders: this.extractNumber(
        powerSource.IceDetails?.NumberOfCylinders || 
        smmtDetails.NumberOfCylinders || 
        data.NumberOfCylinders
      ),
      cylinderArrangement: powerSource.IceDetails?.CylinderArrangement || smmtDetails.CylinderArrangement || data.CylinderArrangement || null,
      valvesPerCylinder: this.extractNumber(
        powerSource.IceDetails?.ValvesPerCylinder || 
        smmtDetails.ValvesPerCylinder || 
        data.ValvesPerCylinder
      ),
      valveGear: powerSource.IceDetails?.ValveGear || smmtDetails.ValveGear || data.ValveGear || null,
      bore: this.extractNumber(
        powerSource.IceDetails?.Bore || 
        smmtDetails.Bore || 
        data.Bore
      ),
      stroke: this.extractNumber(
        powerSource.IceDetails?.Stroke || 
        smmtDetails.Stroke || 
        data.Stroke
      ),
      aspiration: powerSource.IceDetails?.Aspiration || smmtDetails.Aspiration || data.Aspiration || null,
      fuelDelivery: powerSource.IceDetails?.FuelDelivery || data.FuelDelivery || null,
      bodyType: bodyDetails.BodyStyle || vehicleId.DvlaBodyType || smmtDetails.BodyStyle || data.BodyType || null,
      bodyShape: bodyDetails.BodyShape || smmtDetails.BodyShape || data.BodyShape || null,
      doors: this.extractNumber(
        bodyDetails.NumberOfDoors || 
        smmtDetails.NumberOfDoors || 
        data.NumberOfDoors || 
        data.doors
      ),
      seats: this.extractNumber(
        bodyDetails.NumberOfSeats ||
        dvlaTech.SeatCountIncludingDriver ||
        smmtDetails.NumberOfSeats ||
        data.NumberOfSeats ||
        data.seats
      ),
      numberOfAxles: this.extractNumber(
        bodyDetails.NumberOfAxles || 
        smmtDetails.NumberOfAxles || 
        data.NumberOfAxles
      ),
      wheelbase: smmtDetails.Wheelbase || data.Wheelbase || null,
      // VIN and registration details
      vin: vehicleId.Vin || data.Vin || null,
      vinLast5: vehicleId.VinLast5 || data.VinLast5 || null,
      engineNumber: vehicleId.EngineNumber || data.EngineNumber || null,
      dateFirstRegistered: vehicleId.DateFirstRegistered || vehicleId.DateFirstRegisteredInUk || data.DateFirstRegistered || null,
      dateOfManufacture: vehicleId.DateOfManufacture || data.DateOfManufacture || null,
      // Dimensions
      heightMm: this.extractNumber(dimensions.HeightMm || smmtDetails.Height || data.HeightMm),
      lengthMm: this.extractNumber(dimensions.LengthMm || smmtDetails.Length || data.LengthMm),
      widthMm: this.extractNumber(dimensions.WidthMm || smmtDetails.Width || data.WidthMm),
      wheelBaseLengthMm: this.extractNumber(dimensions.WheelBaseLengthMm || data.WheelBaseLengthMm),
      // Weights
      kerbWeightKg: this.extractNumber(weights.KerbWeightKg || smmtDetails.KerbWeight || data.KerbWeightKg),
      grossVehicleWeightKg: this.extractNumber(weights.GrossVehicleWeightKg || smmtDetails.GrossVehicleWeight || dvlaTech.GrossWeight || data.GrossVehicleWeightKg),
      unladenWeightKg: this.extractNumber(weights.UnladenWeightKg || smmtDetails.UnladenWeight || data.UnladenWeightKg),
      payloadWeightKg: this.extractNumber(weights.PayloadWeightKg || smmtDetails.PayloadWeight || data.PayloadWeightKg),
      maxTowableMassBraked: this.extractNumber(dvlaTech.MaxTowableMassBraked || data.MaxTowableMassBraked),
      maxTowableMassUnbraked: this.extractNumber(dvlaTech.MaxTowableMassUnbraked || data.MaxTowableMassUnbraked),
      // Additional details
      fuelTankCapacityLitres: this.extractNumber(bodyDetails.FuelTankCapacityLitres || data.FuelTankCapacityLitres),
      countryOfOrigin: modelData.CountryOfOrigin || smmtDetails.CountryOfOrigin || data.CountryOfOrigin || null,
      euroStatus: modelData.EuroStatus || smmtDetails.EuroStatus || data.EuroStatus || null,
      typeApprovalCategory: modelData.TypeApprovalCategory || smmtDetails.TypeApprovalCategory || data.TypeApprovalCategory || null,
      vehicleClass: modelData.VehicleClass || data.VehicleClass || null,
      marketSectorCode: modelData.MarketSectorCode || smmtDetails.SmmtMarketSectorCode || data.MarketSectorCode || null,
      // CO2 Band
      co2Band: vehicleExcise.DvlaCo2Band || vehicleExcise.DvlaBand || data.Co2Band || null,
      // Sound levels
      soundLevelStationary: this.extractNumber(performance.SoundLevels?.Stationary || data.SoundLevelStationary),
      soundLevelDriveBy: this.extractNumber(performance.SoundLevels?.DriveBy || data.SoundLevelDriveBy),
      // Emissions catalyst
      hasFuelCatalyst: emissions.HasFuelCatalyst !== undefined ? emissions.HasFuelCatalyst : null
    };

    // Format variant in AutoTrader style and store in 'variant' field
    const formattedVariant = vehicleFormatter.formatVariant(basicData);
    if (formattedVariant) {
      basicData.variant = formattedVariant;
    }

    return {
      fuelEconomy,
      co2Emissions,
      insuranceGroup,
      annualTax,
      performance: performanceData,
      // Electric vehicle specific fields
      electricRange: electricVehicleData.electricRange,
      batteryCapacity: electricVehicleData.batteryCapacity,
      chargingTime: electricVehicleData.chargingTime,
      electricMotorPower: electricVehicleData.electricMotorPower,
      electricMotorTorque: electricVehicleData.electricMotorTorque,
      chargingPortType: electricVehicleData.chargingPortType,
      fastChargingCapability: electricVehicleData.fastChargingCapability,
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
