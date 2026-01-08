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
 * @param {Object} apiResponse - Raw API response
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} Parsed HistoryCheckResult
 * @throws {Error} If response is malformed
 */
function parseHistoryResponse(apiResponse, isTestMode = false) {
  // Validate response structure
  const validation = validateHistoryResponse(apiResponse);
  
  if (!validation.isValid) {
    const error = new Error(
      `Malformed History API response: missing fields ${validation.missingFields.join(', ')}`
    );
    error.malformedResponse = apiResponse;
    error.missingFields = validation.missingFields;
    
    console.error('Malformed History API response:', {
      missingFields: validation.missingFields,
      receivedFields: Object.keys(apiResponse),
    });
    
    throw error;
  }

  // Parse the response
  const result = {
    vrm: apiResponse.vrm,
    checkDate: new Date(),
    hasAccidentHistory: Boolean(apiResponse.hasAccidentHistory),
    isStolen: Boolean(apiResponse.isStolen),
    hasOutstandingFinance: Boolean(apiResponse.hasOutstandingFinance),
    isScrapped: Boolean(apiResponse.isScrapped || apiResponse.scrapped),
    isImported: Boolean(apiResponse.isImported || apiResponse.imported),
    isExported: Boolean(apiResponse.isExported || apiResponse.exported),
    isWrittenOff: Boolean(apiResponse.isWrittenOff || apiResponse.writtenOff),
    previousOwners: apiResponse.previousOwners || apiResponse.numberOfOwners || 0,
    numberOfOwners: apiResponse.numberOfOwners || apiResponse.previousOwners || 0,
    numberOfKeys: apiResponse.numberOfKeys || apiResponse.keys || 1,
    keys: apiResponse.keys || apiResponse.numberOfKeys || 1,
    serviceHistory: apiResponse.serviceHistory || 'Contact seller',
    motStatus: apiResponse.motStatus || apiResponse.mot?.status,
    motExpiryDate: apiResponse.motExpiryDate || apiResponse.mot?.expiryDate,
    checkStatus: 'success',
    apiProvider: apiResponse.provider || 'unknown',
    testMode: isTestMode,
  };

  // Add accident details if present
  if (apiResponse.hasAccidentHistory && apiResponse.accidentDetails) {
    result.accidentDetails = parseAccidentDetails(apiResponse.accidentDetails);
  }

  // Add theft details if present
  if (apiResponse.isStolen && apiResponse.theftDetails) {
    result.stolenDetails = parseTheftDetails(apiResponse.theftDetails);
  }

  // Add finance details if present
  if (apiResponse.hasOutstandingFinance && apiResponse.financeDetails) {
    result.financeDetails = parseFinanceDetails(apiResponse.financeDetails);
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
