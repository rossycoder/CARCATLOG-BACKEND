/**
 * Vehicle Validation Middleware
 * Validates vehicle data for AutoTrader compliance before saving
 */

const { validateVehicleData, normalizeVehicleData } = require('../utils/vehicleDataNormalizer');

/**
 * Middleware to validate and normalize vehicle data
 */
const validateAndNormalizeVehicle = (req, res, next) => {
  try {
    // Get vehicle data from request body
    const vehicleData = req.body;
    
    // Validate the data
    const validation = validateVehicleData(vehicleData);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle data validation failed',
        errors: validation.errors
      });
    }
    
    // Normalize the data
    const normalized = normalizeVehicleData(vehicleData);
    
    // Replace request body with normalized data
    req.body = normalized;
    
    next();
  } catch (error) {
    console.error('Validation middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating vehicle data',
      error: error.message
    });
  }
};

/**
 * Middleware to check for duplicate registration numbers
 */
const checkDuplicateRegistration = async (req, res, next) => {
  try {
    const { registrationNumber } = req.body;
    const vehicleId = req.params.id;
    
    // Skip if no registration number
    if (!registrationNumber) {
      return next();
    }
    
    // Check for existing active advert with same registration
    const Car = require('../models/Car');
    const query = {
      registrationNumber: registrationNumber.toUpperCase(),
      advertStatus: 'active'
    };
    
    // Exclude current vehicle if updating
    if (vehicleId) {
      query._id = { $ne: vehicleId };
    }
    
    const existingCar = await Car.findOne(query);
    
    if (existingCar) {
      return res.status(409).json({
        success: false,
        message: `An active advert already exists for registration ${registrationNumber}`,
        existingAdvertId: existingCar._id
      });
    }
    
    next();
  } catch (error) {
    console.error('Duplicate check middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking for duplicates',
      error: error.message
    });
  }
};

module.exports = {
  validateAndNormalizeVehicle,
  checkDuplicateRegistration
};
