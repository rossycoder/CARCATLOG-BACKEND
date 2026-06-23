/**
 * API Response Parser Utility - VERSION 2.0 (FIXED)
 * Contains business logic for parsing API responses from various vehicle data providers
 * 
 * This utility handles all data transformation and normalization logic.
 * API clients should delegate parsing to these methods to maintain separation of concerns.
 */


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
    return null;  // ✅ Return null instead of 'Unknown' (matches Car schema validation)
  }

  const normalized = fuelType.toLowerCase().trim()
    .replace(/[\s_-]+/g, ' '); // normalize separators

  // ── Electric (check BEFORE petrol/diesel) ────────────────
  if (normalized === 'electricity' || normalized === 'electric' ||
      normalized === 'ev' || normalized === 'bev' ||
      normalized === 'electric vehicle' || normalized === 'zero emission' ||
      normalized === 'zero emissions' || normalized === 'pure electric' ||
      normalized === 'fully electric' || normalized === 'battery electric') {
    return 'Electric';
  }

  // ── DVLA "HYBRID ELECTRIC" ────────────────────────────────
  if (normalized === 'hybrid electric' || normalized === 'electric hybrid') {
    return 'Petrol Hybrid';
  }

  // ── "Petrol/Electric" (CheckCarDetails format) ───────────
  // Must check BEFORE plain "petrol" check
  if (normalized === 'petrol/electric' || normalized === 'petrol electric') {
    return 'Petrol Hybrid';
  }
  if (normalized === 'diesel/electric' || normalized === 'diesel electric') {
    return 'Diesel Hybrid';
  }

  // ── Plug-in Hybrids ───────────────────────────────────────
  if (normalized.includes('plug') && normalized.includes('hybrid')) {
    if (normalized.includes('petrol') || normalized.includes('gasoline')) return 'Petrol Plug-in Hybrid';
    if (normalized.includes('diesel')) return 'Diesel Plug-in Hybrid';
    return 'Plug-in Hybrid';
  }
  if (normalized.includes('phev')) {
    if (normalized.includes('petrol') || normalized.includes('gasoline')) return 'Petrol Plug-in Hybrid';
    if (normalized.includes('diesel')) return 'Diesel Plug-in Hybrid';
    return 'Plug-in Hybrid';
  }

  // ── Regular Hybrids ──────────────────────────────────────
  if (normalized.includes('hybrid')) {
    if (normalized.includes('petrol') || normalized.includes('gasoline')) return 'Petrol Hybrid';
    if (normalized.includes('diesel')) return 'Diesel Hybrid';
    return 'Hybrid';
  }

  // ── Pure Electric (partial match) ────────────────────────
  if (normalized.includes('electric') || normalized.includes('electricity')) {
    return 'Electric';
  }

  // ── Standard fuels ───────────────────────────────────────
  if (normalized.includes('petrol') || normalized.includes('gasoline')) return 'Petrol';
  if (normalized.includes('diesel')) return 'Diesel';

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
  
  if (!data) {
    return {};
  }

  // CRITICAL: CheckCarDetails API wraps data in Response.DataItems
  const dataItems = data.Response?.DataItems || data;
  
  const vehicleId = dataItems.VehicleIdentification || {};
  const vehicleReg = dataItems.VehicleRegistration || {}; // BIKES: Often has make/model here
  const bodyDetails = dataItems.BodyDetails || {};
  const performance = dataItems.Performance || {};
  const fuelEconomy = performance.FuelEconomy || {};
  const modelData = dataItems.ModelData || {};
  const transmission = dataItems.Transmission || {};
  const dvlaTech = dataItems.DvlaTechnicalDetails || {};
  const emissions = dataItems.Emissions || {};
  const smmtDetails = dataItems.SmmtDetails || {};
  
  // 🔋 Electric Vehicle Data
  const powerSource = dataItems.PowerSource || {};
  const electricDetails = powerSource.ElectricDetails || {};
  

  

  // CRITICAL: For bikes, make/model often in VehicleRegistration instead of ModelData
  // Also handle empty strings as null
  const extractedMake = vehicleId.DvlaMake || modelData.Make || vehicleReg.Make || smmtDetails.Marque || null;
  
  // CRITICAL FIX: Use ModelData.Range as the base model name - it's always the short clean name
  // e.g. Range="5 Series", Model="530d xDrive M Sport MHEV Auto" → use Range as model
  // e.g. Range="C30", Model="C30 R-Design D Auto" → use Range as model
  const rangeValue = modelData.Range || smmtDetails.Range || null;
  const extractedModel = rangeValue ||
                        modelData.Model || vehicleReg.Model || 
                        (vehicleId.DvlaModel && vehicleId.DvlaModel.trim() !== '' ? vehicleId.DvlaModel : null) || 
                        smmtDetails.Model || null;

  // CRITICAL FIX: variant = full model name (detailed trim), not the short Range
  // e.g. "530d xDrive M Sport MHEV Auto" or SmmtDetails.Variant = "530D XDRIVE M SPORT"
  const extractedVariant = rangeValue 
    ? (modelData.Model || smmtDetails.Variant || modelData.ModelVariant || vehicleId.DvlaModel || null)
    : (smmtDetails.Variant || modelData.ModelVariant || vehicleId.DvlaModel || null);
  

  return {
    make: extractedMake,
    model: extractedModel || 'Unknown',
    // CRITICAL FIX: variant = detailed trim (ModelData.Model or SmmtDetails.Variant)
    variant: extractedVariant,
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
    
    // 🔋 Electric Vehicle Data (from PowerSource.ElectricDetails)
    ...(electricDetails.BatteryDetailsList && electricDetails.BatteryDetailsList.length > 0 ? {
      batteryCapacity: extractNumber(electricDetails.BatteryDetailsList[0]?.CapacityKwh),
    } : {}),
    
    ...(electricDetails.RangeFigures?.RealRangeMiles ? {
      electricRange: extractNumber(electricDetails.RangeFigures.RealRangeMiles),
    } : {}),
    
    // Charging Port Details (extract Type 2 and CCS charging info)
    ...(electricDetails.ChargePortDetailsList && electricDetails.ChargePortDetailsList.length > 0 ? {
      // Type 2 Standard (home charging)
      homeChargingSpeed: (() => {
        const type2Port = electricDetails.ChargePortDetailsList.find(p => p.PortType && p.PortType.includes('Type 2'));
        return type2Port ? extractNumber(type2Port.MaxChargePowerKw) : null;
      })(),
      
      // CCS (rapid charging)
      rapidChargingSpeed: (() => {
        const ccsPort = electricDetails.ChargePortDetailsList.find(p => p.PortType && p.PortType.includes('CCS'));
        return ccsPort ? extractNumber(ccsPort.MaxChargePowerKw) : null;
      })(),
      
      // Charging time 10-80% (Type 2 Standard)
      chargingTime10to80: (() => {
        const type2Port = electricDetails.ChargePortDetailsList.find(p => p.PortType && p.PortType.includes('Type 2'));
        const chargeTimes = type2Port?.ChargeTimes?.AverageChargeTimes10To80Percent;
        // Get the charging time for the maximum power available
        if (chargeTimes && chargeTimes.length > 0) {
          const maxPowerCharge = chargeTimes[chargeTimes.length - 1]; // Last entry usually has highest power
          return extractNumber(maxPowerCharge?.TimeInMinutes);
        }
        return null;
      })(),
    } : {}),
    
    // Motor Details
    ...(electricDetails.MotorDetailsList && electricDetails.MotorDetailsList.length > 0 ? {
      electricMotorPower: extractNumber(electricDetails.MotorDetailsList[0]?.PowerKw),
      electricMotorTorque: extractNumber(electricDetails.MotorDetailsList[0]?.MaxTorqueNm),
    } : {}),
    
    // Vehicle Type (BEV, PHEV, etc.)
    ...(electricDetails.VehicleType ? {
      vehicleType: electricDetails.VehicleType,
    } : {}),
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
