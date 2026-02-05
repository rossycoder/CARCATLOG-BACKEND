/**
 * Electric Vehicle Enhancement Middleware
 * Automatically enhances electric vehicles with comprehensive EV data
 */

const ElectricVehicleEnhancementService = require('../services/electricVehicleEnhancementService');
const AutoDataPopulationService = require('../services/autoDataPopulationService');

/**
 * Middleware to enhance electric vehicle data before saving
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const enhanceElectricVehicleData = async (req, res, next) => {
  try {
    // Check if this is an electric vehicle
    if (req.body.fuelType === 'Electric' || req.vehicleData?.fuelType === 'Electric') {
      console.log('🔋 Electric vehicle detected - enhancing with EV data...');
      
      // Get the vehicle data (could be in req.body or req.vehicleData)
      let vehicleData = req.vehicleData || req.body;
      
      // Enhance with comprehensive electric vehicle data
      vehicleData = ElectricVehicleEnhancementService.enhanceWithEVData(vehicleData);
      
      // Also use the auto data population service for additional defaults
      vehicleData = AutoDataPopulationService.populateMissingData(vehicleData);
      
      // Calculate charging costs for additional context
      const chargingCosts = ElectricVehicleEnhancementService.calculateChargingCosts(vehicleData);
      const chargingTimes = ElectricVehicleEnhancementService.getChargingTimeEstimates(vehicleData);
      
      // Add charging cost estimates to the response (not saved to DB)
      req.chargingEstimates = {
        costs: chargingCosts,
        times: chargingTimes
      };
      
      // Update the request data
      if (req.vehicleData) {
        req.vehicleData = vehicleData;
      } else {
        req.body = vehicleData;
      }
      
      console.log(`✅ Enhanced electric vehicle: ${vehicleData.make} ${vehicleData.model}`);
      console.log(`   - Range: ${vehicleData.electricRange} miles`);
      console.log(`   - Battery: ${vehicleData.batteryCapacity} kWh`);
      console.log(`   - Rapid charging: ${vehicleData.rapidChargingSpeed}kW`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error enhancing electric vehicle data:', error);
    // Don't fail the request, just log the error and continue
    next();
  }
};

/**
 * Middleware to add electric vehicle information to API responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const addElectricVehicleInfo = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to add EV info
  res.json = function(data) {
    // If this is a vehicle response and it's electric, add charging estimates
    if (data && data.fuelType === 'Electric' && req.chargingEstimates) {
      data.chargingEstimates = req.chargingEstimates;
    }
    
    // If this is an array of vehicles, add charging estimates to electric ones
    if (Array.isArray(data)) {
      data = data.map(vehicle => {
        if (vehicle.fuelType === 'Electric') {
          const chargingCosts = ElectricVehicleEnhancementService.calculateChargingCosts(vehicle);
          const chargingTimes = ElectricVehicleEnhancementService.getChargingTimeEstimates(vehicle);
          vehicle.chargingEstimates = {
            costs: chargingCosts,
            times: chargingTimes
          };
        }
        return vehicle;
      });
    }
    
    // Call original json method
    originalJson.call(this, data);
  };
  
  next();
};

/**
 * Validate electric vehicle data
 * @param {Object} vehicleData - Vehicle data to validate
 * @returns {Array} Array of validation errors
 */
const validateElectricVehicleData = (vehicleData) => {
  const errors = [];
  
  if (vehicleData.fuelType === 'Electric') {
    // Check required EV fields
    if (!vehicleData.electricRange && !vehicleData.runningCosts?.electricRange) {
      errors.push('Electric range is required for electric vehicles');
    }
    
    if (!vehicleData.batteryCapacity && !vehicleData.runningCosts?.batteryCapacity) {
      errors.push('Battery capacity is required for electric vehicles');
    }
    
    if (!vehicleData.chargingPortType && !vehicleData.runningCosts?.chargingPortType) {
      errors.push('Charging port type is required for electric vehicles');
    }
    
    // Validate numeric ranges
    const range = vehicleData.electricRange || vehicleData.runningCosts?.electricRange;
    if (range && (range < 50 || range > 1000)) {
      errors.push('Electric range must be between 50 and 1000 miles');
    }
    
    const battery = vehicleData.batteryCapacity || vehicleData.runningCosts?.batteryCapacity;
    if (battery && (battery < 10 || battery > 200)) {
      errors.push('Battery capacity must be between 10 and 200 kWh');
    }
    
    const rapidCharging = vehicleData.rapidChargingSpeed || vehicleData.runningCosts?.rapidChargingSpeed;
    if (rapidCharging && (rapidCharging < 10 || rapidCharging > 500)) {
      errors.push('Rapid charging speed must be between 10 and 500 kW');
    }
  }
  
  return errors;
};

/**
 * Middleware to validate electric vehicle data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateElectricVehicle = (req, res, next) => {
  const vehicleData = req.vehicleData || req.body;
  const errors = validateElectricVehicleData(vehicleData);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ELECTRIC_VEHICLE_VALIDATION_ERROR',
        message: 'Electric vehicle data validation failed',
        details: errors
      }
    });
  }
  
  next();
};

module.exports = {
  enhanceElectricVehicleData,
  addElectricVehicleInfo,
  validateElectricVehicle,
  validateElectricVehicleData
};