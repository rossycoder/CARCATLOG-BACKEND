/**
 * Vehicle Formatter Utility
 * Formats vehicle data in AutoTrader style
 */

class VehicleFormatter {
  /**
   * Format variant in AutoTrader style
   * Example: "2.2 i-CTDi Type S GT" for Honda Civic
   * Example: "320d M Sport" for BMW 3 Series
   * 
   * Format: Complete variant including engine designation and trim
   * 
   * @param {Object} vehicleData - Raw vehicle data from API
   * @returns {string} Formatted variant string
   */
  formatVariant(vehicleData) {
    // 1. If modelVariant is already in good format, use it directly
    if (vehicleData.modelVariant && this.isGoodVariant(vehicleData.modelVariant)) {
      return vehicleData.modelVariant;
    }
    
    // 2. If modelVariant exists but needs cleaning, clean it
    if (vehicleData.modelVariant) {
      const cleaned = this.cleanVariant(vehicleData.modelVariant);
      if (cleaned && this.isGoodVariant(cleaned)) {
        return cleaned;
      }
    }
    
    // 3. Build variant from components if modelVariant is not good
    const parts = [];
    
    // Add fuel type abbreviation if available
    const fuelAbbrev = this.getFuelTypeAbbreviation(
      vehicleData.fuelType,
      vehicleData.engineDescription,
      vehicleData.modelVariant
    );
    
    if (fuelAbbrev) {
      parts.push(fuelAbbrev);
    }
    
    // Add trim level if available
    if (vehicleData.modelVariant) {
      const trimLevel = this.extractTrimLevel(vehicleData.modelVariant);
      if (trimLevel && trimLevel !== fuelAbbrev) {
        parts.push(trimLevel);
      }
    }
    
    // If we built something, return it
    if (parts.length > 0) {
      return parts.join(' ');
    }
    
    // 4. Fallback: return modelVariant as-is if available
    if (vehicleData.modelVariant) {
      return vehicleData.modelVariant;
    }
    
    // 5. Last resort: return null (displayTitle will handle full formatting)
    return null;
  }
  
  /**
   * Clean variant string by removing common noise
   * @param {string} variant - Raw variant string
   * @returns {string} Cleaned variant
   */
  cleanVariant(variant) {
    if (!variant) return null;
    
    // Remove common noise words but keep the important parts
    let cleaned = variant
      .replace(/\b(HATCHBACK|SALOON|ESTATE|COUPE|CONVERTIBLE|SUV)\b/gi, '')
      .replace(/\b(\d+)\s*DOOR\b/gi, '')
      .replace(/\b(\d+)DR\b/gi, '')
      .trim();
    
    // Remove extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned || null;
  }
  
  /**
   * Extract trim level from modelVariant
   * Examples: "S TDI CR" -> "S", "SE TDI" -> "SE", "Sport TSI" -> "Sport"
   * @param {string} modelVariant - Model variant from API
   * @returns {string|null} Trim level
   */
  extractTrimLevel(modelVariant) {
    if (!modelVariant) return null;
    
    // Common trim levels to look for
    const trimPatterns = [
      /\b(SE|S|Sport|GT|GTI|GTD|R-Line|S line|M Sport|AMG|RS|Type R|Type S)\b/i,
      /\b([A-Z]{1,2})\b/  // Single or double letter trims like "S", "SE", "EX"
    ];
    
    for (const pattern of trimPatterns) {
      const match = modelVariant.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
  
  /**
   * Check if the API-provided variant is already in good format
   * @param {string} variant - Variant from API
   * @returns {boolean}
   */
  isGoodVariant(variant) {
    if (!variant) return false;
    
    // Good variants typically have engine size or specific trim names
    const goodPatterns = [
      /\d+\.\d+/,  // Has decimal number (engine size)
      /\d+d/,      // BMW style (320d, 520d)
      /\d+i/,      // BMW style (320i, 520i)
      /TDI|TSI|SDI|GTI|GTD/i,  // VW Group abbreviations
      /M Sport|SE|Sport|GT|AMG|RS|S line/i  // Common trim levels
    ];
    
    return goodPatterns.some(pattern => pattern.test(variant));
  }
  
  /**
   * Get fuel type abbreviation
   * @param {string} fuelType - Full fuel type name
   * @param {string} engineDescription - Engine description from API
   * @param {string} modelVariant - Model variant from API
   * @returns {string|null}
   */
  getFuelTypeAbbreviation(fuelType, engineDescription, modelVariant) {
    // Check engine description first (most accurate)
    if (engineDescription) {
      const desc = engineDescription.toUpperCase();
      
      // VW Group abbreviations
      if (desc.includes('TDI')) return 'TDI';  // Turbocharged Direct Injection (Diesel)
      if (desc.includes('TSI')) return 'TSI';  // Turbocharged Stratified Injection (Petrol)
      if (desc.includes('SDI')) return 'SDI';  // Suction Diesel Injection
      if (desc.includes('GTI')) return 'GTI';  // Grand Touring Injection
      if (desc.includes('GTD')) return 'GTD';  // Grand Touring Diesel
      
      // BMW abbreviations
      if (desc.includes('D ') || desc.includes('DIESEL')) return 'd';  // Diesel
      if (desc.includes('I ') || desc.includes('PETROL')) return 'i';  // Petrol
      if (desc.includes('E ') || desc.includes('ELECTRIC')) return 'e';  // Electric
      if (desc.includes('HYBRID')) return 'e';  // Hybrid
    }
    
    // Check model variant
    if (modelVariant) {
      const variant = modelVariant.toUpperCase();
      if (variant.includes('TDI')) return 'TDI';
      if (variant.includes('TSI')) return 'TSI';
      if (variant.includes('SDI')) return 'SDI';
      if (variant.includes('GTI')) return 'GTI';
      if (variant.includes('GTD')) return 'GTD';
    }
    
    // Fallback to fuel type
    if (!fuelType) return null;
    
    const fuel = fuelType.toLowerCase();
    if (fuel.includes('diesel')) return 'TDI';  // Default diesel abbreviation
    if (fuel.includes('petrol')) return 'TSI';  // Default petrol abbreviation
    if (fuel.includes('electric')) return 'Electric';
    if (fuel.includes('hybrid')) return 'Hybrid';
    
    return null;
  }
  
  /**
   * Get body style description
   * @param {number} doors - Number of doors
   * @param {string} bodyType - Body type from API
   * @param {string} bodyShape - Body shape from API
   * @returns {string|null}
   */
  getBodyStyle(doors, bodyType, bodyShape) {
    // If we have doors, use that
    if (doors && doors >= 2 && doors <= 5) {
      return `${doors} door`;
    }
    
    // Otherwise try to extract from body type
    if (bodyType) {
      const type = bodyType.toUpperCase();
      
      // Extract door count from body type (e.g., "5 DOOR HATCHBACK")
      const doorMatch = type.match(/(\d+)\s*DOOR/);
      if (doorMatch) {
        return `${doorMatch[1]} door`;
      }
      
      // Common body styles
      if (type.includes('ESTATE')) return 'Estate';
      if (type.includes('SALOON')) return 'Saloon';
      if (type.includes('COUPE')) return 'Coupe';
      if (type.includes('CONVERTIBLE')) return 'Convertible';
      if (type.includes('SUV')) return 'SUV';
      if (type.includes('MPV')) return 'MPV';
    }
    
    return null;
  }
  
  /**
   * Format complete vehicle title in AutoTrader style
   * @param {Object} vehicleData - Raw vehicle data
   * @returns {Object} Formatted vehicle data
   */
  formatVehicleTitle(vehicleData) {
    return {
      make: vehicleData.make,
      model: vehicleData.model,
      variant: this.formatVariant(vehicleData),
      // Full title for display
      fullTitle: this.buildFullTitle(
        vehicleData.make,
        vehicleData.model,
        this.formatVariant(vehicleData)
      )
    };
  }
  
  /**
   * Build full title string in AutoTrader format
   * Format: "Make Model EngineSize Variant Transmission"
   * Example: "BMW 3 Series 3.0L M Sport Automatic"
   * 
   * @param {string} make
   * @param {string} model
   * @param {number} engineSize - in litres
   * @param {string} variant
   * @param {string} transmission
   * @returns {string}
   */
  buildFullTitle(make, model, engineSize, variant, transmission) {
    const parts = [];
    
    // Make
    if (make) parts.push(make);
    
    // Model
    if (model) parts.push(model);
    
    // Engine size with L suffix
    if (engineSize) {
      const size = parseFloat(engineSize);
      if (!isNaN(size) && size > 0) {
        parts.push(`${size.toFixed(1)}L`);
      }
    }
    
    // Variant (trim level only, no doors)
    if (variant && variant !== 'null' && variant !== 'undefined' && variant.trim() !== '') {
      parts.push(variant);
    }
    
    // Transmission
    if (transmission) {
      const trans = transmission.charAt(0).toUpperCase() + transmission.slice(1).toLowerCase();
      parts.push(trans);
    }
    
    return parts.filter(Boolean).join(' ');
  }
}

module.exports = new VehicleFormatter();
