/**
 * API Response Unwrapper Utility
 * Handles unwrapping of wrapped API responses like { value: "data", source: "api" }
 */

class ApiResponseUnwrapper {
  /**
   * Unwrap a single value from API response
   * @param {*} wrappedValue - Value that might be wrapped in { value, source } format
   * @returns {*} Unwrapped value or null
   */
  static unwrapValue(wrappedValue) {
    // If null or undefined, return null
    if (wrappedValue === null || wrappedValue === undefined) {
      return null;
    }
    
    // If it's a wrapped object with value property
    if (typeof wrappedValue === 'object' && wrappedValue !== null && 'value' in wrappedValue) {
      return wrappedValue.value;
    }
    
    // If it's already a primitive value, return as-is
    return wrappedValue;
  }

  /**
   * Unwrap multiple values from API response
   * @param {Object} data - Object containing potentially wrapped values
   * @param {Array<string>} fields - Array of field names to unwrap
   * @returns {Object} Object with unwrapped values
   */
  static unwrapFields(data, fields) {
    const unwrapped = {};
    
    for (const field of fields) {
      // Handle nested field paths like 'runningCosts.electricRange'
      const fieldParts = field.split('.');
      let value = data;
      
      // Navigate to the nested field
      for (const part of fieldParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }
      
      // Unwrap the final value
      unwrapped[field] = this.unwrapValue(value);
    }
    
    return unwrapped;
  }

  /**
   * Unwrap electric vehicle specific fields
   * @param {Object} data - API response data
   * @returns {Object} Unwrapped electric vehicle data
   */
  static unwrapElectricVehicleData(data) {
    const electricFields = [
      'electricRange',
      'batteryCapacity', 
      'chargingTime',
      'electricMotorPower',
      'electricMotorTorque',
      'chargingPortType',
      'fastChargingCapability',
      'runningCosts.electricRange',
      'runningCosts.batteryCapacity',
      'runningCosts.chargingTime',
      'runningCosts.electricMotorPower',
      'runningCosts.electricMotorTorque',
      'runningCosts.chargingPortType',
      'runningCosts.fastChargingCapability'
    ];
    
    return this.unwrapFields(data, electricFields);
  }

  /**
   * Unwrap basic vehicle fields
   * @param {Object} data - API response data
   * @returns {Object} Unwrapped basic vehicle data
   */
  static unwrapBasicVehicleData(data) {
    const basicFields = [
      'make',
      'model',
      'variant',
      'color',
      'transmission',
      'fuelType',
      'year',
      'engineSize',
      'bodyType',
      'doors',
      'seats',
      'co2Emissions',
      'annualTax',
      'insuranceGroup'
    ];
    
    return this.unwrapFields(data, basicFields);
  }

  /**
   * Unwrap running costs data
   * @param {Object} data - API response data
   * @returns {Object} Unwrapped running costs data
   */
  static unwrapRunningCostsData(data) {
    const runningCostsFields = [
      'runningCosts.fuelEconomy.urban',
      'runningCosts.fuelEconomy.extraUrban',
      'runningCosts.fuelEconomy.combined',
      'runningCosts.annualTax',
      'runningCosts.insuranceGroup',
      'runningCosts.co2Emissions',
      'runningCosts.electricRange',
      'runningCosts.batteryCapacity',
      'runningCosts.chargingTime'
    ];
    
    return this.unwrapFields(data, runningCostsFields);
  }

  /**
   * Completely unwrap an API response object
   * @param {Object} data - API response data
   * @returns {Object} Completely unwrapped data
   */
  static unwrapCompleteResponse(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const unwrapped = {};

    // Recursively unwrap all properties
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'value' in value) {
        // This is a wrapped value
        unwrapped[key] = value.value;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // This is a nested object, recursively unwrap it
        unwrapped[key] = this.unwrapCompleteResponse(value);
      } else {
        // This is already a primitive value or array
        unwrapped[key] = value;
      }
    }

    return unwrapped;
  }

  /**
   * Get the best available value from multiple sources
   * @param {...*} sources - Multiple potential sources for a value
   * @returns {*} The first non-null unwrapped value
   */
  static getBestValue(...sources) {
    for (const source of sources) {
      const unwrapped = this.unwrapValue(source);
      if (unwrapped !== null && unwrapped !== undefined) {
        return unwrapped;
      }
    }
    return null;
  }

  /**
   * Safely extract numeric value
   * @param {*} value - Value to extract number from
   * @returns {number|null} Extracted number or null
   */
  static extractNumber(value) {
    const unwrapped = this.unwrapValue(value);
    
    if (unwrapped === null || unwrapped === undefined) {
      return null;
    }

    if (typeof unwrapped === 'number') {
      return unwrapped;
    }

    if (typeof unwrapped === 'string') {
      const parsed = parseFloat(unwrapped);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * Safely extract string value
   * @param {*} value - Value to extract string from
   * @returns {string|null} Extracted string or null
   */
  static extractString(value) {
    const unwrapped = this.unwrapValue(value);
    
    if (unwrapped === null || unwrapped === undefined) {
      return null;
    }

    if (typeof unwrapped === 'string') {
      return unwrapped.trim() || null;
    }

    if (typeof unwrapped === 'number') {
      return unwrapped.toString();
    }

    return null;
  }
}

module.exports = ApiResponseUnwrapper;