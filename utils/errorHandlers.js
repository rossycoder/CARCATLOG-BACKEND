/**
 * Error Handlers and Fallback Utilities
 * Provides user-friendly error handling and fallback mechanisms
 */

/**
 * Handle History API unavailability
 * @param {Error} error - Original error
 * @returns {Object} User-friendly error response
 */
function handleHistoryAPIUnavailable(error) {
  return {
    success: false,
    error: 'Vehicle history check temporarily unavailable',
    message: 'We are unable to check the vehicle history at this time. You can proceed with manual verification or try again later.',
    fallbackOptions: {
      manualVerification: true,
      retryLater: true,
    },
    technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
}

/**
 * Handle Valuation API unavailability
 * @param {Error} error - Original error
 * @returns {Object} User-friendly error response
 */
function handleValuationAPIUnavailable(error) {
  return {
    success: false,
    error: 'Vehicle valuation temporarily unavailable',
    message: 'We are unable to provide an automatic valuation at this time. You can enter your own price or try again later.',
    fallbackOptions: {
      manualPriceEntry: true,
      retryLater: true,
    },
    technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
}

/**
 * Determine if error is due to API unavailability
 * @param {Error} error - Error object
 * @returns {boolean} True if API is unavailable
 */
function isAPIUnavailable(error) {
  const unavailableCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'];
  const unavailableStatuses = [502, 503, 504];
  
  return (
    unavailableCodes.includes(error.code) ||
    (error.details && unavailableStatuses.includes(error.details.status))
  );
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} context - Context of the error (e.g., 'history', 'valuation')
 * @returns {string} User-friendly error message
 */
function getUserFriendlyMessage(error, context) {
  // 404 - Vehicle not found in database
  if (error.details?.status === 404 || error.response?.status === 404 || error.message.includes('404')) {
    if (context === 'history' || context === 'MOT history') {
      return 'No vehicle history data found for this registration. This vehicle may not be in our database yet.';
    } else if (context === 'valuation') {
      return 'No valuation data available for this vehicle. You can enter your own price based on market research.';
    }
    return 'No data found for this vehicle registration.';
  }

  // API unavailability
  if (isAPIUnavailable(error)) {
    if (context === 'history') {
      return 'The vehicle history service is temporarily unavailable. Please try again later or proceed with manual verification.';
    } else if (context === 'valuation') {
      return 'The valuation service is temporarily unavailable. Please try again later or enter your own price.';
    }
  }

  // Invalid VRM
  if (error.message.includes('Invalid VRM')) {
    return 'The vehicle registration number you entered is invalid. Please check and try again.';
  }

  // Test mode restriction
  if (error.message.includes('test mode')) {
    return 'In test mode, the vehicle registration must contain the letter "A". Please use a test VRM.';
  }

  // Malformed response
  if (error.message.includes('Malformed')) {
    return 'We received an unexpected response from the service. Our team has been notified. Please try again later.';
  }

  // Timeout
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return 'The request took too long to complete. Please try again.';
  }

  // Generic error
  return 'An unexpected error occurred. Please try again later or contact support if the problem persists.';
}

/**
 * Get actionable next steps for user
 * @param {Error} error - Error object
 * @param {string} context - Context of the error
 * @returns {Array<string>} Array of actionable next steps
 */
function getActionableSteps(error, context) {
  const steps = [];

  // 404 - Vehicle not found
  if (error.details?.status === 404 || error.response?.status === 404 || error.message.includes('404')) {
    steps.push('Verify the registration number is correct');
    steps.push('Try again later as data may be updated');
    
    if (context === 'history' || context === 'MOT history') {
      steps.push('Request vehicle history documents from the seller');
      steps.push('Check MOT history on the official DVSA website');
    } else if (context === 'valuation') {
      steps.push('Research similar vehicles to determine a fair price');
      steps.push('Enter your own asking price based on market research');
    }
    return steps;
  }

  if (isAPIUnavailable(error)) {
    steps.push('Wait a few minutes and try again');
    
    if (context === 'history') {
      steps.push('Proceed with manual vehicle history verification');
      steps.push('Contact the seller for vehicle history documents');
    } else if (context === 'valuation') {
      steps.push('Enter your own asking price');
      steps.push('Research similar vehicles to determine a fair price');
    }
  } else if (error.message.includes('Invalid VRM')) {
    steps.push('Check that you entered the registration number correctly');
    steps.push('Ensure there are no spaces or special characters');
    steps.push('Try entering the registration in a different format');
  } else if (error.message.includes('test mode')) {
    steps.push('Use a test VRM that contains the letter "A"');
    steps.push('Example test VRMs: AB12CDE, TEST123A, VA21XYZ');
  } else {
    steps.push('Try again in a few moments');
    steps.push('Contact support if the problem continues');
  }

  return steps;
}

/**
 * Format error response for API
 * @param {Error} error - Error object
 * @param {string} context - Context of the error
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, context) {
  return {
    success: false,
    error: getUserFriendlyMessage(error, context),
    nextSteps: getActionableSteps(error, context),
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      technicalDetails: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
    }),
  };
}

module.exports = {
  handleHistoryAPIUnavailable,
  handleValuationAPIUnavailable,
  isAPIUnavailable,
  getUserFriendlyMessage,
  getActionableSteps,
  formatErrorResponse,
};
