/**
 * Car Data Normalizer
 * Ensures car data conforms to the Car model schema before saving
 */

class CarDataNormalizer {
  /**
   * Normalize engine size to a number (in liters)
   * @param {string|number} engineSize - Engine size in various formats
   * @returns {number|null} Engine size in liters
   */
  static normalizeEngineSize(engineSize) {
    if (!engineSize) return null;
    
    // If already a number, return as-is
    if (typeof engineSize === 'number') return engineSize;
    
    // Convert string to number, removing non-numeric characters except decimal point
    const cleanedSize = String(engineSize).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanedSize);
    
    if (isNaN(parsed)) return null;
    
    // If the number is very large (likely in cc), convert to liters
    if (parsed > 50) {
      return parsed / 1000; // Convert cc to liters
    }
    
    return parsed; // Already in liters
  }

  /**
   * Normalize transmission to match enum values
   * @param {string} transmission - Transmission type
   * @returns {string} Normalized transmission
   */
  static normalizeTransmission(transmission) {
    if (!transmission) return 'manual';
    
    const normalized = transmission.toLowerCase().trim();
    
    // Map various formats to enum values
    if (normalized.includes('automatic') || normalized.includes('auto')) {
      return 'automatic';
    }
    if (normalized.includes('semi') || normalized.includes('cvt') || normalized.includes('dsg')) {
      return 'semi-automatic';
    }
    
    return 'manual'; // Default
  }

  /**
   * Normalize fuel type to match enum values
   * @param {string} fuelType - Fuel type
   * @returns {string} Normalized fuel type
   */
  static normalizeFuelType(fuelType) {
    if (!fuelType) return 'Petrol';
    
    const normalized = fuelType.toUpperCase().trim();
    
    if (normalized.includes('PETROL') || normalized.includes('GASOLINE')) return 'Petrol';
    if (normalized.includes('DIESEL')) return 'Diesel';
    if (normalized.includes('ELECTRIC') || normalized.includes('EV')) return 'Electric';
    if (normalized.includes('HYBRID')) return 'Hybrid';
    
    return 'Petrol'; // Default
  }

  /**
   * Normalize complete car data object
   * @param {Object} carData - Raw car data
   * @returns {Object} Normalized car data
   */
  static normalizeCarData(carData) {
    const normalized = { ...carData };
    
    // Normalize engine size
    if (normalized.engineSize !== undefined) {
      normalized.engineSize = this.normalizeEngineSize(normalized.engineSize);
    }
    
    // Normalize transmission
    if (normalized.transmission !== undefined) {
      normalized.transmission = this.normalizeTransmission(normalized.transmission);
    }
    
    // Normalize fuel type
    if (normalized.fuelType !== undefined) {
      normalized.fuelType = this.normalizeFuelType(normalized.fuelType);
    }
    
    // Ensure numeric fields are numbers
    if (normalized.year !== undefined && normalized.year !== null) {
      normalized.year = parseInt(normalized.year) || new Date().getFullYear();
    }
    
    if (normalized.mileage !== undefined && normalized.mileage !== null) {
      normalized.mileage = parseInt(normalized.mileage) || 0;
    }
    
    if (normalized.price !== undefined && normalized.price !== null) {
      normalized.price = parseFloat(normalized.price) || null;
    }
    
    if (normalized.doors !== undefined && normalized.doors !== null) {
      normalized.doors = parseInt(normalized.doors) || null;
    }
    
    if (normalized.seats !== undefined && normalized.seats !== null) {
      normalized.seats = parseInt(normalized.seats) || null;
    }
    
    if (normalized.co2Emissions !== undefined && normalized.co2Emissions !== null) {
      normalized.co2Emissions = parseInt(normalized.co2Emissions) || null;
    }
    
    return normalized;
  }
}

module.exports = CarDataNormalizer;