/**
 * Data Merger Utility
 * Intelligently merges vehicle data from CheckCarDetails and Valuation APIs
 * with source tracking
 */

class DataMerger {
  constructor() {
    // All data comes from CheckCarDetails or Valuation APIs
    this.priorityRules = {
      // Basic vehicle info - CheckCarDetails
      make: 'checkcardetails',
      model: 'checkcardetails',
      year: 'checkcardetails',
      color: 'checkcardetails',
      fuelType: 'checkcardetails',
      transmission: 'checkcardetails',
      engineSize: 'checkcardetails',
      bodyType: 'checkcardetails',
      doors: 'checkcardetails',
      seats: 'checkcardetails',
      previousOwners: 'checkcardetails',
      gearbox: 'checkcardetails',
      emissionClass: 'checkcardetails',
      
      // Running costs - CheckCarDetails
      fuelEconomy: 'checkcardetails',
      co2Emissions: 'checkcardetails',
      insuranceGroup: 'checkcardetails',
      annualTax: 'checkcardetails',
      
      // Performance data - CheckCarDetails
      performance: 'checkcardetails',
      
      // Valuation data - Valuation API
      valuation: 'valuation'
    };
  }

  /**
   * Main merge function - combines data from CheckCarDetails and Valuation APIs
   * @param {Object} checkCarData - Data from CheckCarDetails API
   * @param {Object} valuationData - Data from Valuation API
   * @returns {Object} Merged vehicle data with source tracking
   */
  merge(checkCarData, valuationData = null) {
    // Validate inputs
    const checkCarValid = this.validateApiData(checkCarData, 'CheckCarDetails');
    const valuationValid = this.validateApiData(valuationData, 'Valuation');
    
    // If both are invalid, return empty structure
    if (!checkCarValid && !valuationValid) {
      return this.createEmptyVehicleData();
    }

    // Extract make/model/fuelType from valuation description if CheckCarDetails doesn't have it
    let fallbackMake = null;
    let fallbackModel = null;
    let fallbackFuelType = null;
    if (valuationData?.vehicleDescription && (!checkCarData?.make || !checkCarData?.model || !checkCarData?.fuelType)) {
      const extracted = this.extractMakeModelFromDescription(valuationData.vehicleDescription);
      fallbackMake = extracted.make;
      fallbackModel = extracted.model;
      fallbackFuelType = extracted.fuelType;
    }

    // Create merged data structure
    const merged = {
      // Basic vehicle information from CheckCarDetails (with valuation fallback)
      make: this.selectValue('make', checkCarData?.make || fallbackMake),
      model: this.selectValue('model', checkCarData?.model || fallbackModel),
      year: this.selectValue('year', checkCarData?.year),
      color: this.selectValue('color', checkCarData?.color),
      fuelType: this.selectValue('fuelType', checkCarData?.fuelType || fallbackFuelType),
      transmission: this.selectValue('transmission', checkCarData?.transmission),
      engineSize: this.selectValue('engineSize', checkCarData?.engineSize),
      bodyType: this.selectValue('bodyType', checkCarData?.bodyType),
      doors: this.selectValue('doors', checkCarData?.doors),
      seats: this.selectValue('seats', checkCarData?.seats),
      previousOwners: this.selectValue('previousOwners', checkCarData?.previousOwners),
      gearbox: this.selectValue('gearbox', checkCarData?.gearbox),
      emissionClass: this.selectValue('emissionClass', checkCarData?.emissionClass),

      // Running costs from CheckCarDetails
      runningCosts: this.mergeRunningCosts(checkCarData),

      // Performance data from CheckCarDetails
      performance: this.mergePerformanceData(checkCarData),

      // Valuation data from Valuation API
      valuation: this.mergeValuationData(valuationData),

      // Data source tracking
      dataSources: {
        checkCarDetails: checkCarValid,
        valuation: valuationValid,
        timestamp: new Date().toISOString()
      }
    };

    // Add field source tracking for frontend display
    merged.fieldSources = this.trackFieldSources(merged, checkCarData, valuationData);

    return merged;
  }

  /**
   * Extract make and model from valuation description
   * Example: "BMW M6 Gran Coupe Auto M6 Gran Coupe [Petrol / Automatic]"
   * @param {string} description - Vehicle description from valuation API
   * @returns {Object} Extracted make, model, and fuelType
   */
  extractMakeModelFromDescription(description) {
    if (!description || typeof description !== 'string') {
      return { make: null, model: null, fuelType: null };
    }

    // Extract fuel type from brackets
    let fuelType = null;
    const bracketMatch = description.match(/\[(.*?)\]/);
    if (bracketMatch) {
      const bracketContent = bracketMatch[1];
      // Extract fuel type (first part before /)
      const fuelMatch = bracketContent.split('/')[0]?.trim();
      if (fuelMatch) {
        fuelType = fuelMatch;
      }
    }

    // Remove content in brackets
    const cleaned = description.replace(/\[.*?\]/g, '').trim();
    
    // Split by spaces
    const parts = cleaned.split(' ');
    
    if (parts.length < 2) {
      return { make: null, model: null, fuelType };
    }

    // First word is usually the make
    const make = parts[0];
    
    // Rest is the model (take up to first 5 words to avoid getting too much)
    const model = parts.slice(1, Math.min(parts.length, 6)).join(' ');

    console.log(`Extracted from valuation description: Make="${make}", Model="${model}", FuelType="${fuelType}"`);
    
    return { make, model, fuelType };
  }

  /**
   * Merge running costs data from CheckCarDetails
   */
  mergeRunningCosts(checkCarData) {
    return {
      fuelEconomy: {
        urban: this.selectValue('fuelEconomy.urban', 
          checkCarData?.fuelEconomy?.urban,
          'checkcardetails'
        ),
        extraUrban: this.selectValue('fuelEconomy.extraUrban', 
          checkCarData?.fuelEconomy?.extraUrban,
          'checkcardetails'
        ),
        combined: this.selectValue('fuelEconomy.combined', 
          checkCarData?.fuelEconomy?.combined,
          'checkcardetails'
        )
      },
      co2Emissions: this.selectValue('co2Emissions', 
        checkCarData?.co2Emissions
      ),
      insuranceGroup: this.selectValue('insuranceGroup', 
        checkCarData?.insuranceGroup,
        'checkcardetails'
      ),
      annualTax: this.selectValue('annualTax', 
        checkCarData?.annualTax
      )
    };
  }

  /**
   * Merge performance data (CheckCarDetails only)
   */
  mergePerformanceData(checkCarData) {
    if (!checkCarData?.performance) {
      return {
        power: { value: null, source: null },
        torque: { value: null, source: null },
        acceleration: { value: null, source: null },
        topSpeed: { value: null, source: null }
      };
    }

    return {
      power: this.selectValue('performance.power', 
        checkCarData.performance.power, 
        null, 
        'checkcardetails'
      ),
      torque: this.selectValue('performance.torque', 
        checkCarData.performance.torque, 
        null, 
        'checkcardetails'
      ),
      acceleration: this.selectValue('performance.acceleration', 
        checkCarData.performance.acceleration, 
        null, 
        'checkcardetails'
      ),
      topSpeed: this.selectValue('performance.topSpeed', 
        checkCarData.performance.topSpeed, 
        null, 
        'checkcardetails'
      )
    };
  }

  /**
   * Merge valuation data (Valuation API only)
   */
  mergeValuationData(valuationData) {
    if (!valuationData) {
      return {
        tradePrice: { value: null, source: null },
        privatePrice: { value: null, source: null },
        dealerPrice: { value: null, source: null },
        partExchangePrice: { value: null, source: null }
      };
    }

    // Handle both old and new field names from valuation API
    const tradePrice = valuationData.estimatedValue?.trade || valuationData.tradePrice || valuationData.estimatedValue?.trade;
    const privatePrice = valuationData.estimatedValue?.private || valuationData.privatePrice || valuationData.estimatedValue?.private;
    const dealerPrice = valuationData.estimatedValue?.retail || valuationData.dealerPrice || valuationData.estimatedValue?.retail;
    const partExchangePrice = valuationData.estimatedValue?.trade || valuationData.partExchangePrice || valuationData.estimatedValue?.trade;

    return {
      tradePrice: this.selectValue('valuation.tradePrice',
        tradePrice,
        null,
        'valuation'
      ),
      privatePrice: this.selectValue('valuation.privatePrice',
        privatePrice,
        null,
        'valuation'
      ),
      dealerPrice: this.selectValue('valuation.dealerPrice',
        dealerPrice,
        null,
        'valuation'
      ),
      partExchangePrice: this.selectValue('valuation.partExchangePrice',
        partExchangePrice,
        null,
        'valuation'
      )
    };
  }

  /**
   * Select value with source tracking
   */
  selectValue(fieldName, value, forcePriority = null) {
    const prioritySource = forcePriority || this.getPrioritySource(fieldName);
    
    // Special validation for model field - reject if it's just engine size
    if (fieldName === 'model') {
      value = this.validateModelField(value);
    }
    
    const selectedValue = this.isValidValue(value) ? value : null;
    const selectedSource = this.isValidValue(value) ? prioritySource : null;

    return {
      value: selectedValue,
      source: selectedSource
    };
  }

  /**
   * Validate model field - reject if it's just engine size or fuel type
   * Examples of invalid models: "3.0L Petrol", "2.0 Diesel", "1.6L"
   */
  validateModelField(modelValue) {
    if (!modelValue || typeof modelValue !== 'string') {
      return modelValue;
    }

    const trimmed = modelValue.trim();
    
    // Pattern to detect engine size formats: "3.0L", "2.0", "1.6L Petrol", etc.
    const engineSizePattern = /^\d+\.?\d*\s*(L|l|litre|liter)?\s*(petrol|diesel|hybrid|electric)?$/i;
    
    if (engineSizePattern.test(trimmed)) {
      console.log(`Rejecting invalid model value: "${modelValue}" (appears to be engine size)`);
      return null;
    }

    return modelValue;
  }

  getPrioritySource(fieldName) {
    const baseField = fieldName.split('.')[0];
    return this.priorityRules[baseField] || 'checkcardetails';
  }

  isValidValue(value) {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           !(typeof value === 'string' && value.trim() === '') &&
           !(typeof value === 'object' && Object.keys(value).length === 0);
  }

  validateApiData(data, source) {
    if (!data || typeof data !== 'object') {
      console.log(`${source} data is invalid or missing`);
      return false;
    }

    // Check for any useful data
    const hasBasicInfo = data.make || data.model || data.year;
    const hasRunningCosts = data.co2Emissions || data.annualTax || data.fuelEconomy;
    const hasPerformance = data.performance && Object.keys(data.performance).length > 0;
    const hasAdditionalInfo = data.color || data.previousOwners || data.gearbox || data.emissionClass;
    const hasValuation = data.estimatedValue && (
      data.estimatedValue.retail > 0 || 
      data.estimatedValue.trade > 0 || 
      data.estimatedValue.private > 0
    );

    // Accept data if it has ANY useful information
    if (!hasBasicInfo && !hasRunningCosts && !hasPerformance && !hasAdditionalInfo && !hasValuation) {
      console.log(`${source} data contains no useful vehicle information`);
      return false;
    }

    console.log(`${source} data validation passed`);
    return true;
  }

  trackFieldSources(merged, checkCarData, valuationData) {
    const sources = {};

    const basicFields = ['make', 'model', 'year', 'color', 'fuelType', 'transmission', 'engineSize', 'bodyType', 'doors', 'seats', 'previousOwners', 'gearbox', 'emissionClass'];
    basicFields.forEach(field => {
      if (merged[field]?.source) {
        sources[field] = merged[field].source;
      }
    });

    if (merged.runningCosts) {
      sources.runningCosts = {};
      
      if (merged.runningCosts.fuelEconomy) {
        sources.runningCosts.fuelEconomy = {};
        ['urban', 'extraUrban', 'combined'].forEach(type => {
          if (merged.runningCosts.fuelEconomy[type]?.source) {
            sources.runningCosts.fuelEconomy[type] = merged.runningCosts.fuelEconomy[type].source;
          }
        });
      }

      ['co2Emissions', 'insuranceGroup', 'annualTax'].forEach(field => {
        if (merged.runningCosts[field]?.source) {
          sources.runningCosts[field] = merged.runningCosts[field].source;
        }
      });
    }

    if (merged.performance) {
      sources.performance = {};
      ['power', 'torque', 'acceleration', 'topSpeed'].forEach(field => {
        if (merged.performance[field]?.source) {
          sources.performance[field] = merged.performance[field].source;
        }
      });
    }

    if (merged.valuation) {
      sources.valuation = {};
      ['tradePrice', 'privatePrice', 'dealerPrice', 'partExchangePrice'].forEach(field => {
        if (merged.valuation[field]?.source) {
          sources.valuation[field] = merged.valuation[field].source;
        }
      });
    }

    return sources;
  }

  createEmptyVehicleData() {
    return {
      make: { value: null, source: null },
      model: { value: null, source: null },
      year: { value: null, source: null },
      color: { value: null, source: null },
      fuelType: { value: null, source: null },
      transmission: { value: null, source: null },
      engineSize: { value: null, source: null },
      runningCosts: {
        fuelEconomy: {
          urban: { value: null, source: null },
          extraUrban: { value: null, source: null },
          combined: { value: null, source: null }
        },
        co2Emissions: { value: null, source: null },
        insuranceGroup: { value: null, source: null },
        annualTax: { value: null, source: null }
      },
      performance: {
        power: { value: null, source: null },
        torque: { value: null, source: null },
        acceleration: { value: null, source: null },
        topSpeed: { value: null, source: null }
      },
      dataSources: {
        checkCarDetails: false,
        valuation: false,
        timestamp: new Date().toISOString()
      },
      fieldSources: {}
    };
  }
}

module.exports = new DataMerger();
