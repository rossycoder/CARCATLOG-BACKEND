const { body, validationResult } = require('express-validator');

/**
 * Sanitize and validate input data to prevent injection attacks
 */

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove any HTML tags
  str = str.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  str = str.trim();
  
  return str;
};

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => err.msg)
    });
  }
  next();
};

/**
 * Validation rules for trade dealer registration
 */
const tradeDealerRegistrationRules = () => {
  return [
    body('businessName')
      .trim()
      .notEmpty().withMessage('Business name is required')
      .isLength({ min: 2 }).withMessage('Business name must be at least 2 characters')
      .customSanitizer(sanitizeString),
    
    body('contactPerson')
      .trim()
      .notEmpty().withMessage('Contact person name is required')
      .isLength({ min: 2 }).withMessage('Contact person name must be at least 2 characters')
      .customSanitizer(sanitizeString),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .customSanitizer(value => value.replace(/\s/g, '')) // Remove spaces
      .matches(/^(\+44|0)[0-9]{10}$/).withMessage('Invalid UK phone number format (e.g., 07123456789 or +447123456789)'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    
    body('tradingName')
      .optional()
      .trim()
      .customSanitizer(sanitizeString),
    
    body('businessRegistrationNumber')
      .optional()
      .trim(),
    
    body('vatNumber')
      .optional()
      .trim()
  ];
};

/**
 * Validation rules for vehicle data
 */
const vehicleDataRules = () => {
  const currentYear = new Date().getFullYear();
  
  return [
    body('make')
      .trim()
      .notEmpty().withMessage('Make is required')
      .isLength({ min: 2 }).withMessage('Make must be at least 2 characters')
      .customSanitizer(sanitizeString),
    
    body('model')
      .trim()
      .notEmpty().withMessage('Model is required')
      .customSanitizer(sanitizeString),
    
    body('year')
      .optional()
      .isInt({ min: 1900, max: currentYear + 1 })
      .withMessage(`Year must be between 1900 and ${currentYear + 1}`),
    
    body('price')
      .optional()
      .isFloat({ min: 0, max: 10000000 })
      .withMessage('Price must be between 0 and 10,000,000'),
    
    body('mileage')
      .optional()
      .isInt({ min: 0, max: 1000000 })
      .withMessage('Mileage must be between 0 and 1,000,000'),
    
    body('transmission')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['manual', 'automatic', 'semi-automatic'])
      .withMessage('Invalid transmission type'),
    
    body('fuelType')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['petrol', 'diesel', 'electric', 'hybrid', 'plug-in hybrid'])
      .withMessage('Invalid fuel type'),
    
    body('description')
      .optional()
      .trim()
      .customSanitizer(sanitizeString),
    
    body('images')
      .optional()
      .isArray({ max: 20 }).withMessage('Maximum 20 images allowed'),
    
    body('images.*')
      .optional()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Invalid image URL')
  ];
};

/**
 * Validation rules for login
 */
const loginRules = () => {
  return [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ];
};

/**
 * Middleware: Validate trade dealer registration
 */
const validateTradeDealerRegistration = [
  ...tradeDealerRegistrationRules(),
  handleValidationErrors
];

/**
 * Middleware: Validate vehicle data
 */
const validateVehicleData = [
  ...vehicleDataRules(),
  handleValidationErrors
];

/**
 * Middleware: Validate login credentials
 */
const validateLoginCredentials = [
  ...loginRules(),
  handleValidationErrors
];

/**
 * Middleware: Rate limiting check (basic implementation)
 */
const rateLimitCheck = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    next();
  };
};

/**
 * Middleware: Prevent SQL/NoSQL injection
 */
const preventInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (typeof obj === 'string') {
      // Check for common injection patterns
      const injectionPatterns = [
        /(\$where)/i,
        /(\$ne)/i,
        /(\$gt)/i,
        /(\$lt)/i,
        /(\$or)/i,
        /(\$and)/i,
        /(\$regex)/i,
        /(javascript:)/i,
        /(<script)/i,
        /(eval\()/i,
        /(union.*select)/i,
        /(drop.*table)/i
      ];
      
      for (const pattern of injectionPatterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key.startsWith('$') || checkForInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected. Potential security threat.'
    });
  }
  
  next();
};

module.exports = {
  sanitizeString,
  validateTradeDealerRegistration,
  validateVehicleData,
  validateLoginCredentials,
  rateLimitCheck,
  preventInjection,
  handleValidationErrors
};
