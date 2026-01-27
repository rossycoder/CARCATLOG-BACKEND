const axios = require('axios');
const vehicleFormatter = require('../utils/vehicleFormatter');

class DVLAService {
  constructor() {
    this.apiKey = process.env.DVLA_API_KEY;
    this.apiUrl = process.env.DVLA_API_URL || 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Validate UK registration number format
   * Supports various UK registration formats
   */
  validateRegistrationFormat(registrationNumber) {
    if (!registrationNumber || typeof registrationNumber !== 'string') {
      return false;
    }

    // Remove spaces and convert to uppercase
    const cleaned = registrationNumber.replace(/\s/g, '').toUpperCase();

    // UK registration patterns:
    // Current format (2001-present): AB12CDE
    // Prefix format (1983-2001): A123BCD
    // Suffix format (1963-1983): ABC123D
    // Dateless format (pre-1963): ABC123
    const patterns = [
      /^[A-Z]{2}\d{2}[A-Z]{3}$/,     // Current: AB12CDE
      /^[A-Z]\d{1,3}[A-Z]{3}$/,      // Prefix: A123BCD
      /^[A-Z]{3}\d{1,3}[A-Z]$/,      // Suffix: ABC123D
      /^[A-Z]{1,3}\d{1,4}$/,         // Dateless: ABC123
      /^\d{1,4}[A-Z]{1,3}$/          // Reverse dateless: 123ABC
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Lookup vehicle by registration number from DVLA API
   */
  async lookupVehicle(registrationNumber) {
    // Validate format first
    if (!this.validateRegistrationFormat(registrationNumber)) {
      throw new Error('INVALID_REGISTRATION');
    }

    // Clean registration number
    const cleaned = registrationNumber.replace(/\s/g, '').toUpperCase();

    try {
      const response = await axios.post(
        this.apiUrl,
        { registrationNumber: cleaned },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      // Handle different error types
      if (error.response) {
        const status = error.response.status;
        
        if (status === 404) {
          throw new Error('VEHICLE_NOT_FOUND');
        } else if (status === 401 || status === 403) {
          throw new Error('AUTH_ERROR');
        } else if (status === 429) {
          throw new Error('RATE_LIMIT');
        } else {
          throw new Error('DVLA_API_ERROR');
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('NETWORK_ERROR');
      } else {
        throw new Error('NETWORK_ERROR');
      }
    }
  }

  /**
   * Map DVLA response to Car model schema
   */
  mapDVLADataToCarSchema(dvlaData, mileage, additionalData = {}) {
    // Normalize fuel type to match Car model enum
    const normalizeFuelType = (fuelType) => {
      if (!fuelType) return 'Petrol';
      
      const normalized = fuelType.toUpperCase();
      if (normalized.includes('PETROL')) return 'Petrol';
      if (normalized.includes('DIESEL')) return 'Diesel';
      if (normalized.includes('ELECTRIC')) return 'Electric';
      if (normalized.includes('HYBRID')) return 'Hybrid';
      return 'Petrol'; // Default
    };

    // Normalize color (DVLA returns uppercase)
    const normalizeColor = (color) => {
      if (!color) return 'Unknown';
      return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
    };

    // Prepare vehicle data for variant generation
    const vehicleData = {
      make: dvlaData.make || 'Unknown',
      model: dvlaData.model || 'Unknown',
      year: dvlaData.yearOfManufacture || new Date().getFullYear(),
      color: normalizeColor(dvlaData.colour),
      fuelType: normalizeFuelType(dvlaData.fuelType),
      mileage: mileage,
      engineSize: dvlaData.engineCapacity ? dvlaData.engineCapacity / 1000 : null, // Convert cc to liters
      engineSizeLitres: dvlaData.engineCapacity ? dvlaData.engineCapacity / 1000 : null,
      registrationNumber: dvlaData.registrationNumber,
      dataSource: 'DVLA',
      co2Emissions: dvlaData.co2Emissions || null,
      taxStatus: dvlaData.taxStatus || null,
      motStatus: dvlaData.motStatus || null,
      motExpiry: dvlaData.motExpiryDate ? new Date(dvlaData.motExpiryDate) : null,
      dvlaLastUpdated: new Date(),
      // Optional fields from additionalData
      price: additionalData.price || null,
      postcode: additionalData.postcode || null,
      description: additionalData.description || `${dvlaData.make} ${dvlaData.model} (${dvlaData.yearOfManufacture})`,
      transmission: additionalData.transmission || null,
      condition: 'used' // DVLA only has registered vehicles
    };

    // Generate variant automatically using vehicleFormatter
    const variant = vehicleFormatter.formatVariant(vehicleData);
    if (variant) {
      vehicleData.variant = variant;
    }

    return vehicleData;
  }
}

module.exports = new DVLAService();
