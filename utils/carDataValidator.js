/**
 * Car Data Validator
 * Ensures no null or invalid values are saved to database
 */

class CarDataValidator {
  /**
   * Validate and clean car data before saving
   * @param {Object} carData - Raw car data from API or user input
   * @returns {Object} Validated and cleaned car data (NO NULL VALUES)
   */
  static validateAndClean(carData) {
    const cleaned = {};

    // Required fields with defaults - NO NULLS
    cleaned.make = this.cleanString(carData.make) || 'Unknown';
    cleaned.model = this.cleanString(carData.model) || 'Unknown';
    cleaned.year = this.cleanNumber(carData.year, 2000, new Date().getFullYear() + 1) || new Date().getFullYear();
    cleaned.registrationNumber = this.cleanString(carData.registrationNumber)?.toUpperCase() || '';

    // Optional fields with sensible defaults - NO NULLS
    cleaned.variant = this.cleanString(carData.variant) || '';
    cleaned.displayTitle = this.cleanString(carData.displayTitle) || `${cleaned.make} ${cleaned.model}`;
    cleaned.mileage = this.cleanNumber(carData.mileage, 0, 999999) || 0;
    cleaned.color = this.cleanString(carData.color) || 'Not specified';
    cleaned.fuelType = this.cleanString(carData.fuelType) || 'Petrol';
    cleaned.transmission = this.cleanString(carData.transmission)?.toLowerCase() || 'manual';
    cleaned.engineSize = this.cleanNumber(carData.engineSize, 0, 10, true) || 0;
    cleaned.bodyType = this.cleanString(carData.bodyType) || 'Not specified';
    cleaned.doors = this.cleanNumber(carData.doors, 2, 5) || 4;
    cleaned.seats = this.cleanNumber(carData.seats, 2, 9) || 5;
    
    // Emissions and tax - NO NULLS
    cleaned.co2Emissions = this.cleanNumber(carData.co2Emissions, 0, 500) || 0;
    cleaned.taxStatus = this.cleanString(carData.taxStatus) || 'Unknown';
    cleaned.motStatus = this.cleanString(carData.motStatus) || 'Unknown';
    cleaned.motDue = this.cleanDate(carData.motDue) || '';
    cleaned.motExpiry = this.cleanDate(carData.motExpiry) || '';

    // Pricing - NO NULLS
    cleaned.price = this.cleanNumber(carData.price, 0, 10000000) || 0;
    cleaned.estimatedValue = this.cleanNumber(carData.estimatedValue, 0, 10000000) || 0;

    // Description and features - NO NULLS
    // CRITICAL FIX: Add default description if empty (required for non-DVLA cars)
    let description = this.cleanString(carData.description) || '';
    if (!description.trim() && carData.dataSource !== 'DVLA') {
      // Generate default description for non-DVLA cars
      description = `${cleaned.year} ${cleaned.make} ${cleaned.model} ${cleaned.variant || ''} in ${cleaned.color} color. ` +
        `This ${cleaned.bodyType || 'vehicle'} has ${cleaned.mileage.toLocaleString()} miles. ` +
        `Features ${cleaned.transmission} transmission and ${cleaned.fuelType} engine. ` +
        `Contact seller for more details.`;
    } else if (!description.trim() && carData.dataSource === 'DVLA') {
      // For DVLA cars, use minimal description
      description = 'Contact seller for more details.';
    }
    cleaned.description = description;
    
    cleaned.features = Array.isArray(carData.features) ? 
      carData.features.filter(f => f && typeof f === 'string') : [];
    
    // Images - NO NULLS
    cleaned.images = Array.isArray(carData.images) ? 
      carData.images.filter(img => img && typeof img === 'string' && img.startsWith('http')) : [];
    
    cleaned.videoUrl = this.cleanString(carData.videoUrl) || '';

    // Location data - NO NULLS
    cleaned.postcode = this.cleanString(carData.postcode)?.toUpperCase() || '';
    cleaned.locationName = this.cleanString(carData.locationName) || '';
    cleaned.latitude = this.cleanNumber(carData.latitude, -90, 90, true) || 0;
    cleaned.longitude = this.cleanNumber(carData.longitude, -180, 180, true) || 0;
    
    // Only set location if we have valid coordinates
    if (cleaned.latitude !== 0 && cleaned.longitude !== 0) {
      cleaned.location = {
        type: 'Point',
        coordinates: [cleaned.longitude, cleaned.latitude]
      };
    }

    // Seller contact - NO NULLS
    if (carData.sellerContact) {
      cleaned.sellerContact = {
        type: this.cleanString(carData.sellerContact.type) || 'private',
        phoneNumber: this.cleanString(carData.sellerContact.phoneNumber) || '',
        email: this.cleanString(carData.sellerContact.email) || '',
        allowEmailContact: Boolean(carData.sellerContact.allowEmailContact),
        postcode: this.cleanString(carData.sellerContact.postcode)?.toUpperCase() || '',
        businessName: this.cleanString(carData.sellerContact.businessName) || ''
      };
    }

    // Electric vehicle data (only if fuel type is Electric) - NO NULLS
    if (cleaned.fuelType === 'Electric') {
      cleaned.electricRange = this.cleanNumber(carData.electricRange, 0, 1000) || 200;
      cleaned.batteryCapacity = this.cleanNumber(carData.batteryCapacity, 0, 200, true) || 60;
      cleaned.chargingTime = this.cleanNumber(carData.chargingTime, 0, 24, true) || 8;
      cleaned.homeChargingSpeed = this.cleanNumber(carData.homeChargingSpeed, 0, 50, true) || 7.4;
      cleaned.publicChargingSpeed = this.cleanNumber(carData.publicChargingSpeed, 0, 500) || 50;
      cleaned.rapidChargingSpeed = this.cleanNumber(carData.rapidChargingSpeed, 0, 500) || 100;
      cleaned.chargingTime10to80 = this.cleanNumber(carData.chargingTime10to80, 0, 300) || 45;
      cleaned.electricMotorPower = this.cleanNumber(carData.electricMotorPower, 0, 1000) || 150;
      cleaned.electricMotorTorque = this.cleanNumber(carData.electricMotorTorque, 0, 2000) || 300;
      cleaned.chargingPortType = this.cleanString(carData.chargingPortType) || 'Type 2 / CCS';
      cleaned.fastChargingCapability = this.cleanString(carData.fastChargingCapability) || 'DC Fast Charging Compatible';
    }

    // Running costs - NO NULLS
    if (carData.runningCosts) {
      cleaned.runningCosts = {
        fuelCostPerMile: this.cleanNumber(carData.runningCosts.fuelCostPerMile, 0, 1, true) || 0,
        insuranceGroup: this.cleanNumber(carData.runningCosts.insuranceGroup, 1, 50) || 20,
        annualTax: this.cleanNumber(carData.runningCosts.annualTax, 0, 10000) || 0,
        mpg: this.cleanNumber(carData.runningCosts.mpg, 0, 200, true) || 0,
        electricRange: this.cleanNumber(carData.runningCosts.electricRange, 0, 1000) || 0
      };
    }

    // Status fields - NO NULLS
    cleaned.advertStatus = this.cleanString(carData.advertStatus) || 'draft';
    cleaned.condition = this.cleanString(carData.condition) || 'used';
    cleaned.dataSource = this.cleanString(carData.dataSource) || 'manual';
    cleaned.historyCheckStatus = this.cleanString(carData.historyCheckStatus) || 'not_required';

    // User and IDs - NO NULLS (empty string instead of null)
    cleaned.userId = carData.userId || '';
    cleaned.advertId = this.cleanString(carData.advertId) || '';
    cleaned.historyCheckId = carData.historyCheckId || '';

    // Timestamps - NO NULLS
    cleaned.publishedAt = this.cleanDate(carData.publishedAt) || '';

    // Advertising package - NO NULLS
    if (carData.advertisingPackage) {
      cleaned.advertisingPackage = {
        packageId: this.cleanString(carData.advertisingPackage.packageId) || '',
        packageName: this.cleanString(carData.advertisingPackage.packageName) || '',
        duration: this.cleanNumber(carData.advertisingPackage.duration, 1, 365) || 30,
        price: this.cleanNumber(carData.advertisingPackage.price, 0, 10000) || 0,
        purchaseDate: this.cleanDate(carData.advertisingPackage.purchaseDate) || new Date(),
        expiryDate: this.cleanDate(carData.advertisingPackage.expiryDate) || new Date(),
        stripeSessionId: this.cleanString(carData.advertisingPackage.stripeSessionId) || '',
        stripePaymentIntentId: this.cleanString(carData.advertisingPackage.stripePaymentIntentId) || ''
      };
    }

    return cleaned;
  }

  /**
   * Clean and validate string values
   * @param {*} value - Value to clean
   * @returns {string|null} Cleaned string or null
   */
  static cleanString(value) {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') value = String(value);
    
    value = value.trim();
    
    // Remove null/undefined strings
    if (value === 'null' || value === 'undefined' || value === 'NULL' || value === '') {
      return null;
    }
    
    return value;
  }

  /**
   * Clean and validate number values
   * @param {*} value - Value to clean
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @param {boolean} allowDecimals - Allow decimal values
   * @returns {number|null} Cleaned number or null
   */
  static cleanNumber(value, min = -Infinity, max = Infinity, allowDecimals = false) {
    if (value === null || value === undefined || value === '') return null;
    
    const num = Number(value);
    
    if (isNaN(num)) return null;
    if (num < min || num > max) return null;
    
    return allowDecimals ? num : Math.round(num);
  }

  /**
   * Clean and validate date values
   * @param {*} value - Value to clean
   * @returns {Date|null} Cleaned date or null
   */
  static cleanDate(value) {
    if (!value) return null;
    
    const date = new Date(value);
    
    if (isNaN(date.getTime())) return null;
    
    return date;
  }

  /**
   * Validate required fields are present
   * @param {Object} carData - Car data to validate
   * @returns {Object} Validation result with errors
   */
  static validateRequired(carData) {
    const errors = [];
    
    if (!carData.make || carData.make === 'Unknown') {
      errors.push('Make is required');
    }
    
    if (!carData.model || carData.model === 'Unknown') {
      errors.push('Model is required');
    }
    
    if (!carData.year || carData.year < 1900) {
      errors.push('Valid year is required');
    }
    
    if (!carData.price || carData.price <= 0) {
      errors.push('Valid price is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CarDataValidator;
