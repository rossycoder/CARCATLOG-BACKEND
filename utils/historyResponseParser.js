/**
 * History API Response Parser and Validator
 * Parses and validates responses from the History API
 * 
 * IMPORTANT NOTES:
 * - MOT data is NOT included in the carhistorycheck endpoint response
 * - MOT data must be fetched separately using the /vehicledata/mot endpoint
 * - The carhistorycheck endpoint provides: write-off status, stolen records, finance records, keeper history
 * - Do not expect mot.motStatus or mot.motDueDate in the carhistorycheck response
 */

/**
 * Extract model from CheckCarDetails API response with priority-based fallback
 * Priority: VehicleRegistration.Model > SmmtDetails.ModelVariant > SmmtDetails.Series
 * @param {Object} apiResponse - Raw API response from CheckCarDetails
 * @returns {string|null} Extracted model or null if not found
 */
function extractModel(apiResponse) {
  // Priority 1: VehicleRegistration.Model (most specific)
  if (apiResponse.VehicleRegistration?.Model) {
    const model = apiResponse.VehicleRegistration.Model.trim();
    if (model && model !== 'Unknown') {
      console.log(`[HistoryParser] Model extracted from VehicleRegistration.Model: ${model}`);
      return model;
    }
  }
  
  // Priority 2: SmmtDetails.ModelVariant (fallback)
  if (apiResponse.SmmtDetails?.ModelVariant) {
    const model = apiResponse.SmmtDetails.ModelVariant.trim();
    if (model && model !== 'Unknown') {
      console.log(`[HistoryParser] Model extracted from SmmtDetails.ModelVariant: ${model}`);
      return model;
    }
  }
  
  // Priority 3: SmmtDetails.Series (last resort)
  if (apiResponse.SmmtDetails?.Series) {
    const model = apiResponse.SmmtDetails.Series.trim();
    if (model && model !== 'Unknown') {
      console.log(`[HistoryParser] Model extracted from SmmtDetails.Series: ${model}`);
      return model;
    }
  }
  
  // If all fail, return null
  console.warn('[HistoryParser] No model found in API response');
  return null;
}

/**
 * Extract make from CheckCarDetails API response
 * @param {Object} apiResponse - Raw API response from CheckCarDetails
 * @returns {string} Extracted make or 'Unknown'
 */
function extractMake(apiResponse) {
  if (apiResponse.VehicleRegistration?.Make) {
    return apiResponse.VehicleRegistration.Make.trim();
  }
  if (apiResponse.SmmtDetails?.Marque) {
    return apiResponse.SmmtDetails.Marque.trim();
  }
  return 'Unknown';
}

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
  
  // Extract number of previous keepers - try multiple field names
  let numberOfPreviousKeepers = 0;
  if (vehicleHistory.NumberOfPreviousKeepers !== undefined && vehicleHistory.NumberOfPreviousKeepers !== null) {
    numberOfPreviousKeepers = parseInt(vehicleHistory.NumberOfPreviousKeepers) || 0;
  } else if (vehicleHistory.numberOfPreviousKeepers !== undefined && vehicleHistory.numberOfPreviousKeepers !== null) {
    numberOfPreviousKeepers = parseInt(vehicleHistory.numberOfPreviousKeepers) || 0;
  } else if (vehicleHistory.PreviousKeepers !== undefined && vehicleHistory.PreviousKeepers !== null) {
    numberOfPreviousKeepers = parseInt(vehicleHistory.PreviousKeepers) || 0;
  }
  
  console.log(`[HistoryParser] Previous Keepers: ${numberOfPreviousKeepers} (raw: ${vehicleHistory.NumberOfPreviousKeepers})`);
  
  // Extract V5C certificate data
  const v5cCertificateCount = vehicleHistory.V5CCertificateCount || 0;
  const v5cCertificateList = [];
  if (Array.isArray(vehicleHistory.V5CCertificateList)) {
    vehicleHistory.V5CCertificateList.forEach(cert => {
      if (cert.CertificateDate) {
        v5cCertificateList.push({
          certificateDate: new Date(cert.CertificateDate)
        });
      }
    });
  }
  console.log(`[HistoryParser] V5C Certificates: ${v5cCertificateCount}, List entries: ${v5cCertificateList.length}`);
  
  // Extract plate change data
  const plateChanges = vehicleHistory.PlateChangeCount || 0;
  const plateChangesList = [];
  if (Array.isArray(vehicleHistory.PlateChangeList)) {
    vehicleHistory.PlateChangeList.forEach(change => {
      plateChangesList.push({
        date: change.Date ? new Date(change.Date) : null,
        previousVrm: change.PreviousVrm || null,
        newVrm: change.NewVrm || null
      });
    });
  }
  console.log(`[HistoryParser] Plate Changes: ${plateChanges}, List entries: ${plateChangesList.length}`);
  
  // Extract colour change data
  const colourChanges = vehicleHistory.ColourChangeCount || 0;
  const colourChangesList = [];
  if (Array.isArray(vehicleHistory.ColourChangeList)) {
    vehicleHistory.ColourChangeList.forEach(change => {
      colourChangesList.push({
        date: change.Date ? new Date(change.Date) : null,
        previousColour: change.PreviousColour || null,
        newColour: change.NewColour || null
      });
    });
  }
  
  // Extract colour change details
  let colourChangeDetails = null;
  if (vehicleHistory.ColourChangeDetails) {
    colourChangeDetails = {
      currentColour: vehicleHistory.ColourChangeDetails.CurrentColour || null,
      originalColour: vehicleHistory.ColourChangeDetails.OriginalColour || null,
      numberOfPreviousColours: vehicleHistory.ColourChangeDetails.NumberOfPreviousColours || 0,
      lastColour: vehicleHistory.ColourChangeDetails.LastColour || null,
      dateOfLastColourChange: vehicleHistory.ColourChangeDetails.DateOfLastColourChange 
        ? new Date(vehicleHistory.ColourChangeDetails.DateOfLastColourChange) 
        : null
    };
  }
  console.log(`[HistoryParser] Colour Changes: ${colourChanges}, List entries: ${colourChangesList.length}`);
  
  // Extract keeper changes list
  const keeperChangesList = [];
  if (Array.isArray(vehicleHistory.KeeperChangesList)) {
    vehicleHistory.KeeperChangesList.forEach(change => {
      keeperChangesList.push({
        dateOfTransaction: change.DateOfTransaction ? new Date(change.DateOfTransaction) : null,
        numberOfPreviousKeepers: change.NumberOfPreviousKeepers || 0,
        dateOfLastKeeperChange: change.DateOfLastKeeperChange ? new Date(change.DateOfLastKeeperChange) : null
      });
    });
  }
  console.log(`[HistoryParser] Keeper Changes List: ${keeperChangesList.length} entries`);
  
  // Extract VIC count
  const vicCount = vehicleHistory.VicCount || 0;
  console.log(`[HistoryParser] VIC Count: ${vicCount}`);
  
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
    numberOfPreviousKeepers: numberOfPreviousKeepers,
    previousOwners: numberOfPreviousKeepers,
    numberOfOwners: numberOfPreviousKeepers,
    numberOfKeys: 1, // Not provided by CheckCarDetails API
    keys: 1,
    serviceHistory: 'Contact seller', // Not provided by CheckCarDetails API
    // MOT data is NOT included in carhistorycheck endpoint - must be fetched separately
    motStatus: null,
    motExpiryDate: null,
    checkStatus: 'success',
    apiProvider: 'CheckCarDetails',
    testMode: isTestMode,
    // Additional detailed history data
    v5cCertificateCount: v5cCertificateCount,
    v5cCertificateList: v5cCertificateList,
    plateChanges: plateChanges,
    plateChangesList: plateChangesList,
    colourChanges: colourChanges,
    colourChangesList: colourChangesList,
    colourChangeDetails: colourChangeDetails,
    keeperChangesList: keeperChangesList,
    vicCount: vicCount
  };

  // Add write-off details if present
  if (vehicleHistory.writeOffRecord && vehicleHistory.writeoff) {
    // Extract category from status field (e.g., "CAT D VEHICLE DAMAGED" -> "D")
    let category = 'unknown';
    const writeoffData = Array.isArray(vehicleHistory.writeoff) 
      ? vehicleHistory.writeoff[0] 
      : vehicleHistory.writeoff;
    
    // First try the category field if it exists
    if (writeoffData.category) {
      category = writeoffData.category.toUpperCase();
    } 
    // Otherwise extract from status field
    else if (writeoffData.status) {
      const status = writeoffData.status.toUpperCase();
      if (status.includes('CAT A') || status.includes('CATEGORY A')) category = 'A';
      else if (status.includes('CAT B') || status.includes('CATEGORY B')) category = 'B';
      else if (status.includes('CAT C') || status.includes('CATEGORY C')) category = 'C';
      else if (status.includes('CAT D') || status.includes('CATEGORY D')) category = 'D';
      else if (status.includes('CAT S') || status.includes('CATEGORY S')) category = 'S';
      else if (status.includes('CAT N') || status.includes('CATEGORY N')) category = 'N';
    }
    
    console.log(`[HistoryParser] Write-off detected: Category ${category}, Status: ${writeoffData.status}`);
    
    result.accidentDetails = {
      count: 1,
      severity: category,
      dates: writeoffData.lossdate ? [new Date(writeoffData.lossdate)] : [],
    };
    
    // Add write-off category as a direct field for easy access
    result.writeOffCategory = category;
    
    // Add write-off details object
    result.writeOffDetails = {
      category: category,
      date: writeoffData.lossdate ? new Date(writeoffData.lossdate) : null,
      status: writeoffData.status || null,
      description: writeoffData.status || null
    };
  } else {
    // Add default empty accident details
    result.accidentDetails = {
      count: 0,
      severity: 'unknown',
      dates: [],
    };
    
    // Add default write-off category
    result.writeOffCategory = 'none';
    
    // Add default write-off details
    result.writeOffDetails = {
      category: 'none',
      date: null,
      status: null,
      description: null
    };
  }

  // Add stolen details
  if (vehicleHistory.stolenRecord && vehicleHistory.stolen) {
    result.stolenDetails = {
      reportedDate: vehicleHistory.stolen.date ? new Date(vehicleHistory.stolen.date) : new Date(),
      status: vehicleHistory.stolen.status || 'active',
    };
  } else {
    result.stolenDetails = {
      status: 'active',
    };
  }

  // Add finance details
  if (vehicleHistory.financeRecord && vehicleHistory.finance) {
    result.financeDetails = {
      amount: vehicleHistory.finance.amount || 0,
      lender: vehicleHistory.finance.lender || 'Unknown',
      type: vehicleHistory.finance.type || 'unknown',
    };
  } else {
    result.financeDetails = {
      amount: 0,
      lender: 'Unknown',
      type: 'unknown',
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
  extractModel,
  extractMake,
};
