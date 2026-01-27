/**
 * Valuation API Response Parser and Validator
 * Parses and validates responses from the Valuation API
 */

/**
 * Validate that response contains required fields
 * Handles both lowercase and capitalized field names from API
 * @param {Object} response - Raw API response
 * @returns {Object} Validation result with isValid and missing fields
 */
function validateValuationResponse(response) {
  // Check for both lowercase and capitalized versions
  const hasVrm = 'vrm' in response || 'Vrm' in response;
  const hasMileage = 'mileage' in response || 'Mileage' in response;
  const hasValuation = 'estimatedValue' in response || 'ValuationList' in response;

  const missingFields = [];
  if (!hasVrm) missingFields.push('vrm/Vrm');
  if (!hasMileage) missingFields.push('mileage/Mileage');
  if (!hasValuation) missingFields.push('estimatedValue/ValuationList');

  // Check ValuationList sub-fields if present
  const valuationList = response.ValuationList || response.estimatedValue;
  if (valuationList) {
    const hasRetail = 'retail' in valuationList || 'DealerForecourt' in valuationList;
    const hasTrade = 'trade' in valuationList || 'TradeAverage' in valuationList || 'PartExchange' in valuationList;
    const hasPrivate = 'private' in valuationList || 'PrivateClean' in valuationList;
    
    if (!hasRetail && !hasTrade && !hasPrivate) {
      missingFields.push('valuation prices');
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Parse valuation factors from API response
 * @param {Array} factorsData - Factors array from API
 * @returns {Array} Parsed factors
 */
function parseValuationFactors(factorsData) {
  if (!Array.isArray(factorsData)) {
    return [];
  }

  return factorsData.map(factor => ({
    name: factor.name || 'Unknown',
    impact: factor.impact || 'neutral',
    description: factor.description || '',
    valueImpact: factor.valueImpact || 0,
  }));
}

/**
 * Parse market conditions from API response
 * @param {Object} marketData - Market conditions from API
 * @returns {Object} Parsed market conditions
 */
function parseMarketConditions(marketData) {
  if (!marketData || typeof marketData !== 'object') {
    return {
      demand: 'medium',
      supply: 'medium',
      trend: 'stable',
    };
  }

  return {
    demand: marketData.demand || 'medium',
    supply: marketData.supply || 'medium',
    trend: marketData.trend || 'stable',
  };
}

/**
 * Parse Valuation API response into ValuationResult format
 * Handles both lowercase and CheckCarDetails API capitalized format
 * @param {Object} apiResponse - Raw API response
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} Parsed ValuationResult
 * @throws {Error} If response is malformed
 */
function parseValuationResponse(apiResponse, isTestMode = false) {
  // Validate response structure
  const validation = validateValuationResponse(apiResponse);
  
  if (!validation.isValid) {
    const error = new Error(
      `Malformed Valuation API response: missing fields ${validation.missingFields.join(', ')}`
    );
    error.malformedResponse = apiResponse;
    error.missingFields = validation.missingFields;
    
    console.error('Malformed Valuation API response:', {
      missingFields: validation.missingFields,
      receivedFields: Object.keys(apiResponse),
    });
    
    throw error;
  }

  // Helper function to parse numeric values (handles strings with commas and numbers)
  const parseNumericValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Math.round(value);
    if (typeof value === 'string') {
      // Remove commas and parse as integer
      const cleaned = value.replace(/,/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Extract VRM (handle both formats)
  const vrm = apiResponse.vrm || apiResponse.Vrm || 'unknown';
  
  // Extract mileage (handle both formats, parse strings with commas)
  const mileage = parseNumericValue(apiResponse.mileage || apiResponse.Mileage);
  
  // Extract valuation data (handle both formats)
  const valuationList = apiResponse.ValuationList || apiResponse.estimatedValue || {};
  
  // Parse the response
  const result = {
    vrm,
    mileage,
    valuationDate: apiResponse.ValuationTime || apiResponse.valuationDate || new Date().toISOString(),
    estimatedValue: {
      retail: parseNumericValue(valuationList.DealerForecourt || valuationList.retail),
      trade: parseNumericValue(valuationList.TradeAverage || valuationList.trade || valuationList.PartExchange),
      private: parseNumericValue(valuationList.PrivateClean || valuationList.private),
    },
    confidence: apiResponse.confidence || 'medium',
    factors: parseValuationFactors(apiResponse.factors),
    marketConditions: parseMarketConditions(apiResponse.marketConditions),
    validUntil: apiResponse.validUntil 
      ? new Date(apiResponse.validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days
    apiProvider: apiResponse.provider || 'checkcardetails',
    testMode: isTestMode,
    vehicleDescription: apiResponse.VehicleDescription || null,
  };

  return result;
}

/**
 * Handle partial API response (some data missing)
 * Handles both lowercase and CheckCarDetails API capitalized format
 * @param {Object} apiResponse - Partial API response
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} ValuationResult with default values
 */
function handlePartialValuationResponse(apiResponse, isTestMode = false) {
  // Helper function to parse numeric values (handles strings with commas and numbers)
  const parseNumericValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Math.round(value);
    if (typeof value === 'string') {
      // Remove commas and parse as integer
      const cleaned = value.replace(/,/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Extract VRM (handle both formats)
  const vrm = apiResponse.vrm || apiResponse.Vrm || 'unknown';
  
  // Extract mileage (handle both formats, parse strings with commas)
  const mileage = parseNumericValue(apiResponse.mileage || apiResponse.Mileage);
  
  // Extract valuation data (handle both formats)
  const valuationList = apiResponse.ValuationList || apiResponse.estimatedValue || {};
  
  const result = {
    vrm,
    mileage,
    valuationDate: apiResponse.ValuationTime || apiResponse.valuationDate || new Date().toISOString(),
    estimatedValue: {
      retail: parseNumericValue(valuationList.DealerForecourt || valuationList.retail),
      trade: parseNumericValue(valuationList.TradeAverage || valuationList.trade || valuationList.PartExchange),
      private: parseNumericValue(valuationList.PrivateClean || valuationList.private),
    },
    confidence: 'low',
    factors: [],
    marketConditions: {
      demand: 'medium',
      supply: 'medium',
      trend: 'stable',
    },
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for partial data
    apiProvider: apiResponse.provider || 'checkcardetails',
    testMode: isTestMode,
    vehicleDescription: apiResponse.VehicleDescription || null,
  };

  console.warn('Partial Valuation API response received:', {
    vrm: result.vrm,
    availableFields: Object.keys(apiResponse),
  });

  return result;
}

module.exports = {
  parseValuationResponse,
  validateValuationResponse,
  handlePartialValuationResponse,
  parseValuationFactors,
  parseMarketConditions,
};
