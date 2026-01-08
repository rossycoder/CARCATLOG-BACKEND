/**
 * API Credentials Configuration and Validation
 * Loads and validates API credentials for History and Valuation services
 */

class APICredentialsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'APICredentialsError';
  }
}

/**
 * Load and validate API credentials from environment variables
 * @returns {Object} Validated API credentials
 * @throws {APICredentialsError} If credentials are invalid or missing
 */
function loadAPICredentials() {
  const environment = process.env.API_ENVIRONMENT || 'test';
  
  // Validate environment value
  if (!['test', 'production'].includes(environment)) {
    throw new APICredentialsError(
      `Invalid API_ENVIRONMENT: ${environment}. Must be 'test' or 'production'`
    );
  }

  // Load History API credentials
  const historyAPILiveKey = process.env.HISTORY_API_LIVE_KEY;
  const historyAPITestKey = process.env.HISTORY_API_TEST_KEY;
  const historyAPIBaseUrl = process.env.HISTORY_API_BASE_URL;
  const historyAPITestBaseUrl = process.env.HISTORY_API_TEST_BASE_URL;

  // Load Valuation API credentials
  const valuationAPILiveKey = process.env.VALUATION_API_LIVE_KEY;
  const valuationAPITestKey = process.env.VALUATION_API_TEST_KEY;
  const valuationAPIBaseUrl = process.env.VALUATION_API_BASE_URL;
  const valuationAPITestBaseUrl = process.env.VALUATION_API_TEST_BASE_URL;

  // Validate required credentials based on environment
  const missingCredentials = [];

  if (environment === 'production') {
    if (!historyAPILiveKey) missingCredentials.push('HISTORY_API_LIVE_KEY');
    if (!valuationAPILiveKey) missingCredentials.push('VALUATION_API_LIVE_KEY');
  } else {
    if (!historyAPITestKey) missingCredentials.push('HISTORY_API_TEST_KEY');
    if (!valuationAPITestKey) missingCredentials.push('VALUATION_API_TEST_KEY');
  }

  // Validate base URLs
  if (!historyAPIBaseUrl) missingCredentials.push('HISTORY_API_BASE_URL');
  if (!historyAPITestBaseUrl) missingCredentials.push('HISTORY_API_TEST_BASE_URL');
  if (!valuationAPIBaseUrl) missingCredentials.push('VALUATION_API_BASE_URL');
  if (!valuationAPITestBaseUrl) missingCredentials.push('VALUATION_API_TEST_BASE_URL');

  if (missingCredentials.length > 0) {
    throw new APICredentialsError(
      `Missing required API credentials: ${missingCredentials.join(', ')}`
    );
  }

  // Return credentials object
  const credentials = {
    historyAPI: {
      liveKey: historyAPILiveKey,
      testKey: historyAPITestKey,
      baseUrl: historyAPIBaseUrl,
      testBaseUrl: historyAPITestBaseUrl,
    },
    valuationAPI: {
      liveKey: valuationAPILiveKey,
      testKey: valuationAPITestKey,
      baseUrl: valuationAPIBaseUrl,
      testBaseUrl: valuationAPITestBaseUrl,
    },
    environment,
  };

  return credentials;
}

/**
 * Get active API key based on environment
 * @param {Object} apiConfig - API configuration object with liveKey and testKey
 * @param {string} environment - Current environment ('test' or 'production')
 * @returns {string} Active API key
 */
function getActiveAPIKey(apiConfig, environment) {
  return environment === 'production' ? apiConfig.liveKey : apiConfig.testKey;
}

/**
 * Get active base URL based on environment
 * @param {Object} apiConfig - API configuration object with baseUrl and testBaseUrl
 * @param {string} environment - Current environment ('test' or 'production')
 * @returns {string} Active base URL
 */
function getActiveBaseUrl(apiConfig, environment) {
  return environment === 'production' ? apiConfig.baseUrl : apiConfig.testBaseUrl;
}

/**
 * Validate and initialize API credentials on startup
 * Logs validation results and throws error if validation fails
 */
function validateAndInitialize() {
  try {
    const credentials = loadAPICredentials();
    
    console.log('✓ API Credentials validated successfully');
    console.log(`  Environment: ${credentials.environment}`);
    console.log(`  History API: ${getActiveBaseUrl(credentials.historyAPI, credentials.environment)}`);
    console.log(`  Valuation API: ${getActiveBaseUrl(credentials.valuationAPI, credentials.environment)}`);
    
    return credentials;
  } catch (error) {
    console.error('✗ API Credentials validation failed:');
    console.error(`  ${error.message}`);
    throw error;
  }
}

module.exports = {
  loadAPICredentials,
  getActiveAPIKey,
  getActiveBaseUrl,
  validateAndInitialize,
  APICredentialsError,
};
