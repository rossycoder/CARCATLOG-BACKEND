/**
 * History API Response Parser and Validator
 * Parses and validates responses from the History API
 */

/**
 * Validate that response contains required fields
 * @param {Object} response - Raw API response
 * @returns {Object} Validation result with isValid and missing fields
 */
function validateHistoryResponse(response) {
  const requiredFields = [
    'vrm',
    'hasAccidentHistory',
    'isStolen',
    'hasOutstandingFinance'
  ];

  const missingFields = requiredFields.filter(field => !(field in response));

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Parse accident details from API response
 * @param {Object} accidentData - Accident data from API
 * @returns {Object|undefined} Parsed accident details
 */
function parseAccidentDetails(accidentData) {
  if (!accidentData || typeof accidentData !== 'object') {
    return undefined;
  }

  return {
    count: accidentData.count || 0,
    severity: accidentData.severity || 'unknown',
    dates: Array.isArray(accidentData.dates)
      ? accidentData.dates.map(d => new Date(d))
      : [],
  };
}

/**
 * Parse theft details from API response
 * @param {Object} theftData - Theft data from API
 * @returns {Object|undefined} Parsed theft details
 */
function parseTheftDetails(theftData) {
  if (!theftData || typeof theftData !== 'object') {
    return undefined;
  }

  return {
    reportedDate: theftData.reportedDate ? new Date(theftData.reportedDate) : new Date(),
    status: theftData.status || 'active',
  };
}

/**
 * Parse finance details from API response
 * @param {Object} financeData - Finance data from API
 * @returns {Object|undefined} Parsed finance details
 */
function parseFinanceDetails(financeData) {
  if (!financeData || typeof financeData !== 'object') {
    return undefined;
  }

  return {
    amount: financeData.amount || 0,
    lender: financeData.lender || 'Unknown',
    type: financeData.type || 'unknown',
  };
}

/**
 * Parse History API response into HistoryCheckResult format
 * @param {Object} apiResponse - Raw API response from CheckCarDetails
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} Parsed HistoryCheckResult
 * @throws {Error} If response is malformed
 */
function parseHistoryResponse(apiResponse, isTestMode = false) {
  // CheckCarDetails API returns data in VehicleRegistration and VehicleHistory objects
  const vehicleReg = apiResponse.VehicleRegistration || {};
  const vehicleHistory = apiResponse.VehicleHistory || {};
  
  // Extract VRM
  const vrm = vehicleReg.Vrm || apiResponse.registrationNumber || apiResponse.vrm || 'unknown';
  
  // Parse the response from CheckCarDetails format
  const result = {
    vrm: vrm,
    checkDate: new Date(),
    // CheckCarDetails uses stolenRecord, financeRecord, writeOffRecord
    hasAccidentHistory: Boolean(vehicleHistory.writeOffRecord || vehicleHistory.writeoff),
    isStolen: Boolean(vehicleHistory.stolenRecord || vehicleHistory.stolen),
    hasOutstandingFinance: Boolean(vehicleHistory.financeRecord || vehicleHistory.finance),
    isScrapped: Boolean(vehicleReg.Scrapped),
    isImported: Boolean(vehicleReg.Imported || vehicleReg.ImportNonEu),
    isExported: Boolean(vehicleReg.Exported),
    isWrittenOff: Boolean(vehicleHistory.writeOffRecord || vehicleHistory.writeoff),
    previousOwners: vehicleHistory.NumberOfPreviousKeepers || 0,
    numberOfOwners: vehicleHistory.NumberOfPreviousKeepers || 0,
    numberOfKeys: 1, // Not provided by CheckCarDetails API
    keys: 1,
    serviceHistory: 'Contact seller', // Not provided by CheckCarDetails API
    motStatus: apiResponse.mot?.motStatus || 'Unknown',
    motExpiryDate: apiResponse.mot?.motDueDate || null,
    checkStatus: 'success',
    apiProvider: 'CheckCarDetails',
    testMode: isTestMode,
  };

  // Add write-off details if present
  if (vehicleHistory.writeOffRecord && vehicleHistory.writeoff) {
    result.accidentDetails = {
      count: 1,
      severity: vehicleHistory.writeoff.category || 'unknown',
      dates: vehicleHistory.writeoff.date ? [new Date(vehicleHistory.writeoff.date)] : [],
    };
  }

  // Add theft details if present
  if (vehicleHistory.stolenRecord && vehicleHistory.stolen) {
    result.stolenDetails = {
      reportedDate: vehicleHistory.stolen.date ? new Date(vehicleHistory.stolen.date) : new Date(),
      status: vehicleHistory.stolen.status || 'active',
    };
  }

  // Add finance details if present
  if (vehicleHistory.financeRecord && vehicleHistory.finance) {
    result.financeDetails = {
      amount: vehicleHistory.finance.amount || 0,
      lender: vehicleHistory.finance.lender || 'Unknown',
      type: vehicleHistory.finance.type || 'unknown',
    };
  }

  return result;
}

/**
 * Handle partial API response (some data missing)
 * @param {Object} apiResponse - Partial API response
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} HistoryCheckResult with partial status
 */
function handlePartialResponse(apiResponse, isTestMode = false) {
  const result = {
    vrm: apiResponse.vrm || 'unknown',
    checkDate: new Date(),
    hasAccidentHistory: apiResponse.hasAccidentHistory !== undefined 
      ? Boolean(apiResponse.hasAccidentHistory) 
      : false,
    isStolen: apiResponse.isStolen !== undefined 
      ? Boolean(apiResponse.isStolen) 
      : false,
    hasOutstandingFinance: apiResponse.hasOutstandingFinance !== undefined 
      ? Boolean(apiResponse.hasOutstandingFinance) 
      : false,
    checkStatus: 'partial',
    apiProvider: apiResponse.provider || 'unknown',
    testMode: isTestMode,
  };

  console.warn('Partial History API response received:', {
    vrm: result.vrm,
    availableFields: Object.keys(apiResponse),
  });

  return result;
}

module.exports = {
  parseHistoryResponse,
  validateHistoryResponse,
  handlePartialResponse,
  parseAccidentDetails,
  parseTheftDetails,
  parseFinanceDetails,
};
