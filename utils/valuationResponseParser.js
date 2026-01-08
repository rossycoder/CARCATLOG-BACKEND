/**
 * Valuation API Response Parser and Validator
 * Parses and validates responses from the Valuation API
 */

/**
 * Validate that response contains required fields
 * @param {Object} response - Raw API response
 * @returns {Object} Validation result with isValid and missing fields
 */
function validateValuationResponse(response) {
  const requiredFields = [
    'vrm',
    'mileage',
    'estimatedValue'
  ];

  const missingFields = requiredFields.filter(field => !(field in response));

  // Also check that estimatedValue has required sub-fields
  if (response.estimatedValue) {
    const valueFields = ['retail', 'trade', 'private'];
    const missingValueFields = valueFields.filter(
      field => !(field in response.estimatedValue)
    );
    
    if (missingValueFields.length > 0) {
      missingFields.push(...missingValueFields.map(f => `estimatedValue.${f}`));
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

  // Parse the response
  const result = {
    vrm: apiResponse.vrm,
    mileage: apiResponse.mileage,
    valuationDate: new Date(),
    estimatedValue: {
      retail: apiResponse.estimatedValue.retail,
      trade: apiResponse.estimatedValue.trade,
      private: apiResponse.estimatedValue.private,
    },
    confidence: apiResponse.confidence || 'medium',
    factors: parseValuationFactors(apiResponse.factors),
    marketConditions: parseMarketConditions(apiResponse.marketConditions),
    validUntil: apiResponse.validUntil 
      ? new Date(apiResponse.validUntil)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days
    apiProvider: apiResponse.provider || 'unknown',
    testMode: isTestMode,
  };

  return result;
}

/**
 * Handle partial API response (some data missing)
 * @param {Object} apiResponse - Partial API response
 * @param {boolean} isTestMode - Whether in test mode
 * @returns {Object} ValuationResult with default values
 */
function handlePartialValuationResponse(apiResponse, isTestMode = false) {
  const result = {
    vrm: apiResponse.vrm || 'unknown',
    mileage: apiResponse.mileage || 0,
    valuationDate: new Date(),
    estimatedValue: {
      retail: apiResponse.estimatedValue?.retail || 0,
      trade: apiResponse.estimatedValue?.trade || 0,
      private: apiResponse.estimatedValue?.private || 0,
    },
    confidence: 'low',
    factors: [],
    marketConditions: {
      demand: 'medium',
      supply: 'medium',
      trend: 'stable',
    },
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for partial data
    apiProvider: apiResponse.provider || 'unknown',
    testMode: isTestMode,
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
