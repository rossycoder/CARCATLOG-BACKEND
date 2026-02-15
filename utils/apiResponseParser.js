/**
 * API Response Parser Utility - VERSION 2.0 (FIXED)
 * Contains business logic for parsing API responses from various vehicle data providers
 * 
 * This utility handles all data transformation and normalization logic.
 * API clients should delegate parsing to these methods to maintain separation of concerns.
 */

console.log('🔧 [ApiResponseParser] Loading VERSION 2.0 - FIXED PARSER');

/**
 * Extract numeric value from various formats
 * @param {*} value - Value to extract number from
 * @returns {number|null} Extracted number or null
 */
function extractNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Normalize fuel type to standard format (simple approach - trust API data)
 * @param {string} fuelType - Raw fuel type string
 * @returns {string} Normalized fuel type
 */
function normalizeFuelType(fuelType) {
  if (!fuelType || typeof fuelType !== 'string') {
    return 'Unknown';
  }
  
  const normalized = fuelType.toLowerCase().trim();
  
  // Check for plug-in hybrids first
  if (normalized.includes('plug-in') && normalized.includes('hybrid')) {
    // Check for specific plug-in hybrid types
    if (normalized.includes('petrol')) {
      return 'Petrol Plug-in Hybrid';
    }
    if (normalized.includes('diesel')) {
      return 'Diesel Plug-in Hybrid';
    }
    return 'Plug-in Hybrid';
  }
  
  // Check for regular hybrids
  if (normalized.includes('hybrid')) {
    // Check for specific hybrid types
    if (normalized.includes('petrol') || normalized.includes('gasoline')) {
      return 'Petrol Hybrid';
    }
    if (normalized.includes('diesel')) {
      return 'Diesel Hybrid';
    }
    // Generic hybrid (when subtype not specified)
    return 'Hybrid';
  }
  
  if (normalized.includes('petrol') || normalized.includes('gasoline')) {
    return 'Petrol';
  }
  if (normalized.includes('diesel')) {
    return 'Diesel';
  }
  if (normalized.includes('electric') || normalized.includes('ev')) {
    return 'Electric';
  }
  
  // Return capitalized version if no match
  return fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase();
}

/**
 * Normalize transmission type to standard format
 * @param {string} transmission - Raw transmission string
 * @returns {string} Normalized transmission type
 */
function normalizeTransmission(transmission) {
  if (!transmission || typeof transmission !== 'string') {
    return 'Unknown';
  }
  
  const normalized = transmission.toLowerCase().trim();
  
  if (normalized.includes('manual')) {
    return 'Manual';
  }
  if (normalized.includes('automatic') || normalized.includes('auto')) {
    return 'Automatic';
  }
  if (normalized.includes('semi') || normalized.includes('cvt') || normalized.includes('dsg')) {
    return 'Semi-Automatic';
  }
  
  // Return capitalized version if no match
  return transmission.charAt(0).toUpperCase() + transmission.slice(1).toLowerCase();
}

/**
 * Parse CheckCarDetails API response
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed vehicle data
 */
function parseCheckCarDetailsResponse(data) {
  console.log('🔧 [ApiResponseParser] parseCheckCarDetailsResponse called - VERSION 2.0');
  
  if (!data) {
    return {};
  }

  const vehicleId = data.VehicleIdentification || {};
  const bodyDetails = data.BodyDetails || {};
  const performance = data.Performance || {};
  const fuelEconomy = performance.FuelEconomy || {};
  const modelData = data.ModelData || {};
  const transmission = data.Transmission || {};
  const dvlaTech = data.DvlaTechnicalDetails || {};
  const emissions = data.Emissions || {};
  const smmtDetails = data.SmmtDetails || {};
  
  console.log('🔍 [Parser] fuelType from modelData:', modelData.FuelType);
  console.log('🔍 [Parser] bodyType from bodyDetails:', bodyDetails.BodyStyle);
  console.log('🔍 [Parser] engineSize from dvlaTech:', dvlaTech.EngineCapacityCc);
  console.log('🔍 [Parser] combinedMpg from fuelEconomy:', fuelEconomy.CombinedMpg);
  console.log('🔍 [Parser] SmmtDetails available:', !!smmtDetails);
  console.log('🔍 [Parser] SmmtDetails.CombinedMpg:', smmtDetails.CombinedMpg);
  console.log('🔍 [Parser] SmmtDetails.UrbanColdMpg:', smmtDetails.UrbanColdMpg);
  console.log('🔍 [Parser] SmmtDetails.Co2:', smmtDetails.Co2);

  return {
    make: vehicleId.DvlaMake || modelData.Make || null,
    model: vehicleId.DvlaModel || modelData.Model || null,
    variant: modelData.Range || modelData.ModelVariant || smmtDetails.Range || null,
    year: extractNumber(vehicleId.YearOfManufacture),
    fuelType: normalizeFuelType(modelData.FuelType || vehicleId.DvlaFuelType),
    transmission: normalizeTransmission(transmission.TransmissionType || smmtDetails.Transmission),
    bodyType: bodyDetails.BodyStyle || vehicleId.DvlaBodyType || smmtDetails.BodyStyle || null,
    doors: extractNumber(bodyDetails.NumberOfDoors || smmtDetails.NumberOfDoors),
    seats: extractNumber(bodyDetails.NumberOfSeats || dvlaTech.SeatCountIncludingDriver || smmtDetails.NumberOfSeats),
    engineSize: extractNumber(dvlaTech.EngineCapacityCc || smmtDetails.EngineCapacity) / 1000, // Convert cc to litres
    
    // Running costs - PRIORITY: SmmtDetails (most reliable), then fuelEconomy, then modelData
    urbanMpg: extractNumber(smmtDetails.UrbanColdMpg || fuelEconomy.UrbanColdMpg),
    extraUrbanMpg: extractNumber(smmtDetails.ExtraUrbanMpg || fuelEconomy.ExtraUrbanMpg),
    combinedMpg: extractNumber(smmtDetails.CombinedMpg || fuelEconomy.CombinedMpg),
    co2Emissions: extractNumber(smmtDetails.Co2 || emissions.ManufacturerCo2 || vehicleId.DvlaCo2),
    insuranceGroup: smmtDetails.InsuranceGroup || modelData.InsuranceGroup || null,
    annualTax: extractNumber(modelData.AnnualTax || modelData.VehicleTax),
    
    // Performance
    power: extractNumber(performance.Power && performance.Power.Bhp ? performance.Power.Bhp : (smmtDetails.PowerBhp || null)),
    torque: extractNumber(performance.Torque && performance.Torque.Nm ? performance.Torque.Nm : (smmtDetails.TorqueNm || null)),
    acceleration: extractNumber(performance.Statistics && performance.Statistics.ZeroToOneHundredKph ? performance.Statistics.ZeroToOneHundredKph : null),
    topSpeed: extractNumber(performance.Statistics && performance.Statistics.MaxSpeedMph ? performance.Statistics.MaxSpeedMph : (smmtDetails.MaxSpeedMph || null)),
  };
}

/**
 * Parse valuation response
 * @param {Object} data - Raw valuation API response
 * @returns {Object} Parsed valuation data
 */
function parseValuationResponse(data) {
  if (!data || !data.ValuationList) {
    return null;
  }

  const valuation = data.ValuationList;

  return {
    dealerPrice: extractNumber(valuation.DealerForecourt),
    privatePrice: extractNumber(valuation.PrivateClean),
    partExchangePrice: extractNumber(valuation.PartExchange),
    tradePrice: extractNumber(valuation.TradeAverage),
    estimatedValue: extractNumber(valuation.PrivateClean), // Use private as default estimate
  };
}

/**
 * Parse vehicle registration response
 * @param {Object} data - Raw registration API response
 * @returns {Object} Parsed registration data
 */
function parseVehicleRegistrationResponse(data) {
  if (!data) {
    return {};
  }

  return {
    vrm: data.registrationNumber || data.vrm || null,
    make: data.Make || data.make || null,
    model: data.Model || data.model || null,
    colour: data.Colour || data.colour || null,
    year: extractNumber(data.YearOfManufacture || data.year),
    fuelType: normalizeFuelType(data.FuelType || data.fuelType),
  };
}

/**
 * Parse vehicle specs response
 * @param {Object} data - Raw specs API response
 * @returns {Object} Parsed specs data
 */
function parseVehicleSpecsResponse(data) {
  if (!data) {
    return {};
  }

  const vehicleId = data.VehicleIdentification || {};
  const bodyDetails = data.BodyDetails || {};

  return {
    make: vehicleId.DvlaMake || vehicleId.Make || null,
    model: vehicleId.DvlaModel || vehicleId.Model || null,
    doors: extractNumber(bodyDetails.NumberOfDoors),
    seats: extractNumber(bodyDetails.NumberOfSeats),
    bodyType: bodyDetails.BodyShape || bodyDetails.BodyType || null,
    engineSize: extractNumber(vehicleId.EngineCapacity),
  };
}

/**
 * Parse mileage response
 * @param {Object} data - Raw mileage API response
 * @returns {Object} Parsed mileage data
 */
function parseMileageResponse(data) {
  if (!data) {
    return { vrm: null, readings: [] };
  }

  const readings = (data.mileage || []).map(reading => ({
    mileage: extractNumber(reading.Mileage),
    date: reading.Date,
    source: reading.Source,
  }));

  return {
    vrm: data.registrationNumber || data.vrm || null,
    readings: readings,
  };
}

/**
 * Parse MOT response
 * @param {Object} data - Raw MOT API response
 * @returns {Object} Parsed MOT data
 */
function parseMOTResponse(data) {
  if (!data) {
    return { vrm: null, tests: [] };
  }

  const tests = (data.motHistory || data.motTests || []).map(test => ({
    completedDate: test.completedDate,
    testResult: test.testResult,
    odometerValue: extractNumber(test.odometerValue),
    expiryDate: test.expiryDate,
  }));

  return {
    vrm: data.registrationNumber || data.vrm || null,
    tests: tests,
    motStatus: data.motStatus || null,
    motDueDate: data.motDueDate || null,
  };
}

module.exports = {
  extractNumber,
  normalizeFuelType,
  normalizeTransmission,
  parseCheckCarDetailsResponse,
  parseValuationResponse,
  parseVehicleRegistrationResponse,
  parseVehicleSpecsResponse,
  parseMileageResponse,
  parseMOTResponse,
};
