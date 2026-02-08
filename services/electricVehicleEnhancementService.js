/**
 * Electric Vehicle Enhancement Service
 * Automatically enhances electric vehicles with comprehensive EV data
 */

const AutoDataPopulationService = require('./autoDataPopulationService');

class ElectricVehicleEnhancementService {
  
  /**
   * Enhanced electric vehicle database with real-world data
   */
  static ENHANCED_EV_DATABASE = {
    'BMW': {
      'i4': {
        'M50': {
          electricRange: 270,
          batteryCapacity: 83.9,
          chargingTime: 8.25, // 0-100% home charging
          homeChargingSpeed: 7.4, // kW (more realistic for UK home charging)
          publicChargingSpeed: 50, // kW
          rapidChargingSpeed: 100, // kW (BMW i4 M50 actual spec)
          chargingTime10to80: 45, // minutes (more realistic)
          electricMotorPower: 400, // kW
          electricMotorTorque: 795, // Nm
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 100kW',
          batteryType: 'Lithium-ion',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 4.1, // miles per kWh
          chargingCurve: 'Optimized for fast charging',
          preconditioning: 'Battery preconditioning available',
          regenerativeBraking: 'Adaptive regenerative braking',
          driveType: 'AWD' // M50 is all-wheel drive
        },
        'eDrive40': {
          electricRange: 365,
          batteryCapacity: 83.9,
          chargingTime: 8.25,
          homeChargingSpeed: 11,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 150,
          chargingTime10to80: 35,
          electricMotorPower: 250,
          electricMotorTorque: 430,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 150kW',
          batteryType: 'Lithium-ion',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 4.3,
          chargingCurve: 'Optimized for fast charging',
          preconditioning: 'Battery preconditioning available',
          regenerativeBraking: 'Adaptive regenerative braking',
          driveType: 'RWD' // eDrive40 is rear-wheel drive
        }
      },
      'i3': {
        'default': {
          electricRange: 190,
          batteryCapacity: 42.2,
          chargingTime: 6,
          homeChargingSpeed: 11,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 50,
          chargingTime10to80: 40,
          electricMotorPower: 125,
          electricMotorTorque: 250,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 50kW',
          batteryType: 'Lithium-ion',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 4.5,
          chargingCurve: 'Standard charging curve',
          preconditioning: 'Basic preconditioning',
          regenerativeBraking: 'Single-pedal driving available'
        }
      },
      'iX': {
        'xDrive50': {
          electricRange: 380,
          batteryCapacity: 111.5,
          chargingTime: 11,
          homeChargingSpeed: 11,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 200,
          chargingTime10to80: 35,
          electricMotorPower: 385,
          electricMotorTorque: 765,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 200kW',
          batteryType: 'Lithium-ion',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 3.4,
          chargingCurve: 'Advanced charging curve optimization',
          preconditioning: 'Intelligent battery preconditioning',
          regenerativeBraking: 'Adaptive regenerative braking with coasting'
        }
      }
    },
    'TESLA': {
      'Model 3': {
        'Standard Range Plus': {
          electricRange: 267,
          batteryCapacity: 54,
          chargingTime: 8,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 170,
          chargingTime10to80: 25,
          electricMotorPower: 211,
          electricMotorTorque: 375,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 170kW',
          batteryType: 'Lithium-ion (LFP)',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 4.9,
          chargingCurve: 'Tesla optimized charging curve',
          preconditioning: 'Automatic Supercharger preconditioning',
          regenerativeBraking: 'One-pedal driving'
        },
        'Long Range': {
          electricRange: 358,
          batteryCapacity: 75,
          chargingTime: 10,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 250,
          chargingTime10to80: 30,
          electricMotorPower: 239,
          electricMotorTorque: 420,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 250kW',
          batteryType: 'Lithium-ion (NCA)',
          batteryWarranty: '8 years / 120,000 miles',
          energyConsumption: 4.8,
          chargingCurve: 'Tesla optimized charging curve',
          preconditioning: 'Automatic Supercharger preconditioning',
          regenerativeBraking: 'One-pedal driving'
        },
        'Performance': {
          electricRange: 315,
          batteryCapacity: 75,
          chargingTime: 10,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 250,
          chargingTime10to80: 30,
          electricMotorPower: 340,
          electricMotorTorque: 639,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 250kW',
          batteryType: 'Lithium-ion (NCA)',
          batteryWarranty: '8 years / 120,000 miles',
          energyConsumption: 4.2,
          chargingCurve: 'Tesla optimized charging curve',
          preconditioning: 'Automatic Supercharger preconditioning',
          regenerativeBraking: 'One-pedal driving with Track Mode'
        }
      },
      'Model S': {
        'default': {
          electricRange: 405,
          batteryCapacity: 100,
          chargingTime: 12,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 250,
          chargingTime10to80: 40,
          electricMotorPower: 493,
          electricMotorTorque: 800,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 250kW',
          batteryType: 'Lithium-ion (NCA)',
          batteryWarranty: '8 years / 150,000 miles',
          energyConsumption: 4.1,
          chargingCurve: 'Tesla optimized charging curve',
          preconditioning: 'Automatic Supercharger preconditioning',
          regenerativeBraking: 'One-pedal driving with adaptive suspension'
        }
      },
      'Model Y': {
        'Long Range': {
          electricRange: 326,
          batteryCapacity: 75,
          chargingTime: 10,
          homeChargingSpeed: 11,
          publicChargingSpeed: 150,
          rapidChargingSpeed: 250,
          chargingTime10to80: 30,
          electricMotorPower: 324,
          electricMotorTorque: 493,
          chargingPortType: 'Tesla Supercharger / Type 2',
          fastChargingCapability: 'Tesla Supercharger up to 250kW',
          batteryType: 'Lithium-ion (NCA)',
          batteryWarranty: '8 years / 120,000 miles',
          energyConsumption: 4.3,
          chargingCurve: 'Tesla optimized charging curve',
          preconditioning: 'Automatic Supercharger preconditioning',
          regenerativeBraking: 'One-pedal driving'
        }
      }
    },
    'AUDI': {
      'e-tron': {
        'default': {
          electricRange: 250,
          batteryCapacity: 95,
          chargingTime: 9.5,
          homeChargingSpeed: 11,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 150,
          chargingTime10to80: 30,
          electricMotorPower: 300,
          electricMotorTorque: 664,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 150kW',
          batteryType: 'Lithium-ion',
          batteryWarranty: '8 years / 100,000 miles',
          energyConsumption: 2.6,
          chargingCurve: 'Consistent high-speed charging',
          preconditioning: 'Route-based battery preconditioning',
          regenerativeBraking: 'Adjustable regenerative braking'
        }
      }
    }
  };

  /**
   * Get comprehensive electric vehicle data
   * @param {string} make - Vehicle make
   * @param {string} model - Vehicle model  
   * @param {string} variant - Vehicle variant
   * @returns {Object|null} Electric vehicle data or null if not found
   */
  static getComprehensiveEVData(make, model, variant) {
    const makeUpper = (make || '').toUpperCase();
    const modelLower = (model || '').toLowerCase();
    const variantLower = (variant || '').toLowerCase();
    
    if (!this.ENHANCED_EV_DATABASE[makeUpper]) {
      return null;
    }
    
    const makeData = this.ENHANCED_EV_DATABASE[makeUpper];
    
    // Find matching model (case insensitive)
    let modelData = null;
    for (const [dbModel, data] of Object.entries(makeData)) {
      if (dbModel.toLowerCase() === modelLower || 
          modelLower.includes(dbModel.toLowerCase()) ||
          dbModel.toLowerCase().includes(modelLower)) {
        modelData = data;
        break;
      }
    }
    
    if (!modelData) {
      return null;
    }
    
    // Find matching variant or use default
    if (modelData[variantLower]) {
      return modelData[variantLower];
    } else if (modelData.default) {
      return modelData.default;
    } else {
      // Return first available variant
      return Object.values(modelData)[0];
    }
  }

  /**
   * Enhance vehicle data with electric vehicle information
   * @param {Object} vehicleData - Base vehicle data
   * @returns {Object} Enhanced vehicle data with EV information
   */
  static enhanceWithEVData(vehicleData) {
    // Only enhance electric vehicles
    if (vehicleData.fuelType !== 'Electric') {
      return vehicleData;
    }

    console.log(`🔋 Enhancing electric vehicle: ${vehicleData.make} ${vehicleData.model} ${vehicleData.variant}`);

    // Get comprehensive EV data
    let evData = this.getComprehensiveEVData(vehicleData.make, vehicleData.model, vehicleData.variant);
    
    if (!evData) {
      // Fall back to generic defaults
      console.log(`⚠️ No specific EV data found, using generic defaults`);
      evData = AutoDataPopulationService.getElectricVehicleDefaults(vehicleData.make, vehicleData.model, vehicleData.year);
    }

    // Enhance running costs object
    if (!vehicleData.runningCosts) {
      vehicleData.runningCosts = {};
    }

    // Add comprehensive EV data to running costs
    Object.assign(vehicleData.runningCosts, {
      electricRange: evData.electricRange,
      batteryCapacity: evData.batteryCapacity,
      chargingTime: evData.chargingTime,
      homeChargingSpeed: evData.homeChargingSpeed,
      publicChargingSpeed: evData.publicChargingSpeed,
      rapidChargingSpeed: evData.rapidChargingSpeed,
      chargingTime10to80: evData.chargingTime10to80,
      electricMotorPower: evData.electricMotorPower,
      electricMotorTorque: evData.electricMotorTorque,
      chargingPortType: evData.chargingPortType,
      fastChargingCapability: evData.fastChargingCapability,
      co2Emissions: 0, // Electric vehicles have zero emissions
      annualTax: 0, // Electric vehicles have £0 road tax
      // Additional EV-specific fields
      batteryType: evData.batteryType,
      batteryWarranty: evData.batteryWarranty,
      energyConsumption: evData.energyConsumption,
      chargingCurve: evData.chargingCurve,
      preconditioning: evData.preconditioning,
      regenerativeBraking: evData.regenerativeBraking
    });

    // Add individual EV fields for backward compatibility
    Object.assign(vehicleData, {
      electricRange: evData.electricRange,
      batteryCapacity: evData.batteryCapacity,
      chargingTime: evData.chargingTime,
      homeChargingSpeed: evData.homeChargingSpeed,
      publicChargingSpeed: evData.publicChargingSpeed,
      rapidChargingSpeed: evData.rapidChargingSpeed,
      chargingTime10to80: evData.chargingTime10to80,
      electricMotorPower: evData.electricMotorPower,
      electricMotorTorque: evData.electricMotorTorque,
      chargingPortType: evData.chargingPortType,
      fastChargingCapability: evData.fastChargingCapability,
      co2Emissions: 0,
      annualTax: 0
    });

    // Add electric vehicle features if not already present
    if (!vehicleData.features) {
      vehicleData.features = [];
    }

    const evFeatures = [
      'Electric Vehicle',
      'Zero Emissions',
      'Instant Torque',
      'Regenerative Braking',
      'Silent Operation',
      'Home Charging Compatible',
      'Public Charging Compatible'
    ];

    // Add rapid charging feature if supported
    if (evData.rapidChargingSpeed >= 100) {
      evFeatures.push('Rapid Charging Compatible');
    }

    // Add Tesla-specific features
    if (vehicleData.make?.toUpperCase() === 'TESLA') {
      evFeatures.push('Tesla Supercharger Network', 'Over-the-Air Updates', 'Autopilot Ready');
    }

    // Add BMW-specific features
    if (vehicleData.make?.toUpperCase() === 'BMW') {
      evFeatures.push('BMW iDrive', 'BMW ConnectedDrive', 'BMW Charging');
    }

    // Merge features without duplicates
    vehicleData.features = [...new Set([...vehicleData.features, ...evFeatures])];

    console.log(`✅ Enhanced EV data: ${evData.electricRange}mi range, ${evData.batteryCapacity}kWh battery, ${evData.rapidChargingSpeed}kW rapid charging`);

    return vehicleData;
  }

  /**
   * Calculate estimated charging costs
   * @param {Object} evData - Electric vehicle data
   * @param {number} electricityRate - Cost per kWh (default: UK average £0.30)
   * @returns {Object} Charging cost estimates
   */
  static calculateChargingCosts(evData, electricityRate = 0.30) {
    const batteryCapacity = evData.batteryCapacity || 60;
    
    return {
      homeChargingCost: {
        full: Math.round(batteryCapacity * electricityRate * 100) / 100,
        per100Miles: Math.round((batteryCapacity * electricityRate * 100 / evData.electricRange) * 100) / 100
      },
      publicChargingCost: {
        full: Math.round(batteryCapacity * 0.45 * 100) / 100, // Public charging ~£0.45/kWh
        per100Miles: Math.round((batteryCapacity * 0.45 * 100 / evData.electricRange) * 100) / 100
      },
      rapidChargingCost: {
        full: Math.round(batteryCapacity * 0.65 * 100) / 100, // Rapid charging ~£0.65/kWh
        per100Miles: Math.round((batteryCapacity * 0.65 * 100 / evData.electricRange) * 100) / 100
      }
    };
  }

  /**
   * Get charging time estimates for different scenarios
   * @param {Object} evData - Electric vehicle data
   * @returns {Object} Charging time estimates
   */
  static getChargingTimeEstimates(evData) {
    const batteryCapacity = evData.batteryCapacity || 60;
    
    return {
      homeCharging: {
        empty_to_full: evData.chargingTime || Math.round(batteryCapacity / (evData.homeChargingSpeed || 7.4)),
        empty_to_80: Math.round((evData.chargingTime || batteryCapacity / (evData.homeChargingSpeed || 7.4)) * 0.8),
        per_hour: Math.round((evData.electricRange || 200) / (evData.chargingTime || 8))
      },
      publicCharging: {
        empty_to_full: Math.round(batteryCapacity / (evData.publicChargingSpeed || 50)),
        empty_to_80: Math.round(batteryCapacity * 0.8 / (evData.publicChargingSpeed || 50)),
        per_hour: Math.round((evData.electricRange || 200) / (batteryCapacity / (evData.publicChargingSpeed || 50)))
      },
      rapidCharging: {
        ten_to_80: evData.chargingTime10to80 || Math.round(batteryCapacity * 0.7 / (evData.rapidChargingSpeed || 100) * 60),
        empty_to_80: Math.round(batteryCapacity * 0.8 / (evData.rapidChargingSpeed || 100) * 60),
        per_hour: Math.round((evData.electricRange || 200) * 0.7 / (evData.chargingTime10to80 || 45) * 60)
      }
    };
  }
}

module.exports = ElectricVehicleEnhancementService;