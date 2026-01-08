// Custom DVLA Error Classes
class DVLAError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DVLAValidationError extends DVLAError {
  constructor(message = 'Invalid registration number format') {
    super(message, 'INVALID_REGISTRATION', 400);
  }
}

class DVLANotFoundError extends DVLAError {
  constructor(message = 'Vehicle not found in DVLA database') {
    super(message, 'VEHICLE_NOT_FOUND', 404);
  }
}

class DVLAAuthError extends DVLAError {
  constructor(message = 'DVLA API authentication failed') {
    super(message, 'AUTH_ERROR', 500);
  }
}

class DVLARateLimitError extends DVLAError {
  constructor(message = 'DVLA API rate limit exceeded. Please try again later') {
    super(message, 'RATE_LIMIT', 429);
  }
}

class DVLANetworkError extends DVLAError {
  constructor(message = 'Network error connecting to DVLA API') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

class DVLAAPIError extends DVLAError {
  constructor(message = 'DVLA API returned an error') {
    super(message, 'DVLA_API_ERROR', 500);
  }
}

/**
 * Convert error code string to appropriate error instance
 */
function createErrorFromCode(errorCode) {
  switch (errorCode) {
    case 'INVALID_REGISTRATION':
      return new DVLAValidationError();
    case 'VEHICLE_NOT_FOUND':
      return new DVLANotFoundError();
    case 'AUTH_ERROR':
      return new DVLAAuthError();
    case 'RATE_LIMIT':
      return new DVLARateLimitError();
    case 'NETWORK_ERROR':
      return new DVLANetworkError();
    case 'DVLA_API_ERROR':
      return new DVLAAPIError();
    default:
      return new DVLAError('Unknown error occurred', 'UNKNOWN_ERROR', 500);
  }
}

/**
 * Format error response for API
 */
function formatErrorResponse(error, includeDetails = false) {
  const response = {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An error occurred'
    }
  };

  // Include stack trace and details only in development
  if (includeDetails && process.env.NODE_ENV === 'development') {
    response.error.details = {
      stack: error.stack,
      name: error.name
    };
  }

  return response;
}

/**
 * Log error with sanitized user message
 */
function logError(error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context
  };

  // Log detailed error for debugging
  console.error('[DVLA Error]', JSON.stringify(logEntry, null, 2));

  // Return sanitized message for user
  return getSanitizedMessage(error);
}

/**
 * Get user-friendly sanitized error message
 */
function getSanitizedMessage(error) {
  // Never expose internal errors or API keys
  if (error instanceof DVLAAuthError) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  if (error instanceof DVLAValidationError) {
    return error.message;
  }

  if (error instanceof DVLANotFoundError) {
    return 'Vehicle not found. Please check the registration number and try again.';
  }

  if (error instanceof DVLARateLimitError) {
    return 'Too many requests. Please try again in a few minutes.';
  }

  if (error instanceof DVLANetworkError) {
    return 'Unable to connect to vehicle lookup service. Please try again.';
  }

  if (error instanceof DVLAAPIError) {
    return 'Vehicle lookup service error. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Express middleware for handling DVLA errors
 */
function dvlaErrorMiddleware(err, req, res, next) {
  // Convert string error codes to error instances
  if (err.message && typeof err.message === 'string' && err.message.includes('_')) {
    err = createErrorFromCode(err.message);
  }

  // Log the error
  const sanitizedMessage = logError(err, {
    method: req.method,
    path: req.path,
    body: req.body
  });

  // Send formatted response
  const response = formatErrorResponse(err, true);
  response.error.message = sanitizedMessage;

  res.status(err.statusCode || 500).json(response);
}

module.exports = {
  DVLAError,
  DVLAValidationError,
  DVLANotFoundError,
  DVLAAuthError,
  DVLARateLimitError,
  DVLANetworkError,
  DVLAAPIError,
  createErrorFromCode,
  formatErrorResponse,
  logError,
  getSanitizedMessage,
  dvlaErrorMiddleware
};
