/**
 * DVLA Response Validator
 * Validates DVLA API responses and handles missing/null fields
 */

/**
 * Validate DVLA response structure
 * @param {Object} response - DVLA API response
 * @returns {Object} - Validation result { valid: boolean, errors: string[] }
 */
function validateDVLAResponse(response) {
  const errors = [];

  // Check if response exists
  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      errors: ['Response is null or not an object']
    };
  }

  // Required fields
  const requiredFields = [
    'registrationNumber',
    'make',
    'model',
    'colour',
    'fuelType',
    'yearOfManufacture'
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!response[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate data types
  if (response.yearOfManufacture && typeof response.yearOfManufacture !== 'number') {
    errors.push('yearOfManufacture must be a number');
  }

  if (response.engineCapacity && typeof response.engineCapacity !== 'number') {
    errors.push('engineCapacity must be a number');
  }

  if (response.co2Emissions && typeof response.co2Emissions !== 'number') {
    errors.push('co2Emissions must be a number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Apply default values for missing optional fields
 * @param {Object} response - DVLA API response
 * @returns {Object} - Response with defaults applied
 */
function applyDefaults(response) {
  return {
    ...response,
    engineCapacity: response.engineCapacity || null,
    co2Emissions: response.co2Emissions || null,
    taxStatus: response.taxStatus || 'Unknown',
    motStatus: response.motStatus || 'Unknown'
  };
}

/**
 * Validate and sanitize DVLA response
 * @param {Object} response - DVLA API response
 * @returns {Object} - Validated and sanitized response
 * @throws {Error} - If validation fails
 */
function validateAndSanitize(response) {
  // Validate structure
  const validation = validateDVLAResponse(response);
  
  if (!validation.valid) {
    const error = new Error('Invalid DVLA response structure');
    error.code = 'INVALID_RESPONSE';
    error.details = validation.errors;
    throw error;
  }

  // Apply defaults for missing optional fields
  return applyDefaults(response);
}

module.exports = {
  validateDVLAResponse,
  applyDefaults,
  validateAndSanitize
};
