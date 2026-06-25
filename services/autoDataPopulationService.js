/**
 * Automatic Data Population Service
 * Ensures ALL cars have complete data and no important fields are null
 */

class AutoDataPopulationService {
  /**
   * Get default values for electric vehicles based on make and model
   * @param {string} make - Car make
   * @param {string} model - Car model
   * @param {number} year - Car year
   * @returns {Object} Default electric vehicle data
   */
  static getElectricVehicleDefaults(make, model, year) {
    const makeLower = (make || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const currentYear = new Date().getFullYear();
    
    // Default values based on make and model
    let defaults = {
      electricRange: 200, // Default range in miles
      batteryCapacity: 60, // Default battery capacity in kWh
      chargingTime: 8, // Default home charging time in hours (0-100%)
      homeChargingSpeed: 7.4, // Default home charging speed in kW
      publicChargingSpeed: 50, // Default public charging speed in kW
      rapidChargingSpeed: 100, // Default rapid charging speed in kW
      chargingTime10to80: 45, // Default rapid charging time 10-80% in minutes
      electricMotorPower: 150, // Default motor power in kW
      electricMotorTorque: 300, // Default motor torque in Nm
      chargingPortType: 'Type 2 / CCS',
      fastChargingCapability: 'DC Fast Charging Compatible'
    };
    
    // Tesla specific defaults
    if (makeLower.includes('tesla')) {
      defaults = {
        electricRange: 350,
        batteryCapacity: 75,
        chargingTime: 10,
        homeChargingSpeed: 11,
        publicChargingSpeed: 150,
        rapidChargingSpeed: 250,
        chargingTime10to80: 30,
        electricMotorPower: 250,
        electricMotorTorque: 400,
        chargingPortType: 'Tesla Supercharger / Type 2',
        fastChargingCapability: 'Tesla Supercharger Compatible'
      };
    }
    
    // BMW i-series defaults
    else if (makeLower.includes('bmw') && (modelLower.includes('i3') || modelLower.includes('i4') || modelLower.includes('ix'))) {
      defaults = {
        electricRange: 270,
        batteryCapacity: 83.9,
        chargingTime: 8.25,
        homeChargingSpeed: 7.4, // More realistic UK home charging
        publicChargingSpeed: 50,
        rapidChargingSpeed: 100, // BMW i4 actual spec
        chargingTime10to80: 45, // More realistic
        electricMotorPower: 200,
        electricMotorTorque: 400,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging'
      };
    }
    
    // Audi e-tron defaults
    else if (makeLower.includes('audi') && (modelLower.includes('e-tron') || modelLower.includes('etron'))) {
      defaults = {
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
        fastChargingCapability: 'CCS Rapid Charging up to 150kW'
      };
    }
    
    // Volkswagen ID series defaults
    else if (makeLower.includes('volkswagen') && modelLower.includes('id')) {
      defaults = {
        electricRange: 260,
        batteryCapacity: 77,
        chargingTime: 7.5,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 125,
        chargingTime10to80: 35,
        electricMotorPower: 150,
        electricMotorTorque: 310,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 125kW'
      };
    }
    
    // Mercedes EQC/EQS defaults
    else if (makeLower.includes('mercedes') && (modelLower.includes('eq') || modelLower.includes('electric'))) {
      defaults = {
        electricRange: 300,
        batteryCapacity: 80,
        chargingTime: 8,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 110,
        chargingTime10to80: 40,
        electricMotorPower: 300,
        electricMotorTorque: 700,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 110kW'
      };
    }
    
    // Nissan Leaf defaults
    else if (makeLower.includes('nissan') && modelLower.includes('leaf')) {
      defaults = {
        electricRange: 168,
        batteryCapacity: 40,
        chargingTime: 7.5,
        homeChargingSpeed: 6.6,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 50,
        chargingTime10to80: 60,
        electricMotorPower: 110,
        electricMotorTorque: 320,
        chargingPortType: 'Type 2 / CHAdeMO',
        fastChargingCapability: 'CHAdeMO Rapid Charging up to 50kW'
      };
    }
    
    // Hyundai/Kia electric defaults
    else if ((makeLower.includes('hyundai') || makeLower.includes('kia')) && 
             (modelLower.includes('ionic') || modelLower.includes('ev6') || modelLower.includes('e-niro'))) {
      defaults = {
        electricRange: 280,
        batteryCapacity: 77.4,
        chargingTime: 7.4,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 175,
        chargingTime10to80: 18,
        electricMotorPower: 170,
        electricMotorTorque: 350,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 175kW'
      };
    }
    
    // Polestar defaults
    else if (makeLower.includes('polestar')) {
      defaults = {
        electricRange: 270,
        batteryCapacity: 78,
        chargingTime: 8,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 150,
        chargingTime10to80: 35,
        electricMotorPower: 300,
        electricMotorTorque: 490,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 150kW'
      };
    }
    
    // Jaguar I-PACE defaults
    else if (makeLower.includes('jaguar') && modelLower.includes('pace')) {
      defaults = {
        electricRange: 234,
        batteryCapacity: 90,
        chargingTime: 12.75,
        homeChargingSpeed: 7,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 100,
        chargingTime10to80: 45,
        electricMotorPower: 294,
        electricMotorTorque: 696,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 100kW'
      };
    }
    
    // MG electric vehicle defaults
    else if (makeLower.includes('mg')) {
      // MG ZS EV defaults (most common)
      if (modelLower.includes('zs')) {
        defaults = {
          electricRange: 273, // Long Range version
          batteryCapacity: 72.6,
          chargingTime: 10.5,
          homeChargingSpeed: 7,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 92,
          chargingTime10to80: 47,
          electricMotorPower: 130,
          electricMotorTorque: 280,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 92kW'
        };
      }
      // MG4 defaults
      else if (modelLower.includes('mg4') || modelLower.includes('4')) {
        defaults = {
          electricRange: 281,
          batteryCapacity: 64,
          chargingTime: 9.5,
          homeChargingSpeed: 7,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 135,
          chargingTime10to80: 35,
          electricMotorPower: 150,
          electricMotorTorque: 250,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 135kW'
        };
      }
      // MG5 defaults
      else if (modelLower.includes('mg5') || modelLower.includes('5')) {
        defaults = {
          electricRange: 214,
          batteryCapacity: 61.1,
          chargingTime: 9.5,
          homeChargingSpeed: 7,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 87,
          chargingTime10to80: 43,
          electricMotorPower: 115,
          electricMotorTorque: 280,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 87kW'
        };
      }
      // Generic MG EV defaults
      else {
        defaults = {
          electricRange: 220,
          batteryCapacity: 61,
          chargingTime: 9,
          homeChargingSpeed: 7,
          publicChargingSpeed: 50,
          rapidChargingSpeed: 87,
          chargingTime10to80: 40,
          electricMotorPower: 120,
          electricMotorTorque: 280,
          chargingPortType: 'Type 2 / CCS',
          fastChargingCapability: 'CCS Rapid Charging up to 87kW'
        };
      }
    }
    
    // Generic electric vehicle defaults for unknown makes/models
    
    return defaults;
  }

  /**
   * Get default values for hybrid vehicles based on make and model
   * @param {string} make - Car make
   * @param {string} model - Car model
   * @param {string} fuelType - Fuel type (to determine hybrid type)
   * @returns {Object} Default hybrid vehicle data
   */
  static getHybridVehicleDefaults(make, model, fuelType) {
    const makeLower = (make || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();
    const isPlugInHybrid = fuelType && fuelType.toLowerCase().includes('plug-in');
    
    // Plug-in hybrids have larger batteries and electric range
    // Regular hybrids (self-charging) have smaller batteries and minimal electric range
    let defaults = {};
    
    if (isPlugInHybrid) {
      // ── Plug-in Hybrid Defaults ──────────────────────────────────────────
      defaults = {
        electricRange: 30, // Typical PHEV electric range (25-40 miles)
        batteryCapacity: 13.5, // Typical PHEV battery (10-18 kWh)
        chargingTime: 4, // Full charge on home charger
        homeChargingSpeed: 3.6, // Standard UK home charging
        publicChargingSpeed: 7.4, // Public AC charging
        rapidChargingSpeed: 0, // Most PHEVs don't support rapid charging
        chargingTime10to80: 0, // Not applicable for PHEVs
        electricMotorPower: 80, // Typical PHEV electric motor
        electricMotorTorque: 250, // Typical PHEV torque
        chargingPortType: 'Type 2',
        fastChargingCapability: 'AC Charging Only (Type 2)'
      };
      
      // BMW PHEV specific (330e, 530e, X5 xDrive45e)
      if (makeLower.includes('bmw')) {
        defaults.electricRange = 37;
        defaults.batteryCapacity = 12;
        defaults.chargingTime = 3.5;
        defaults.homeChargingSpeed = 3.7;
        defaults.electricMotorPower = 83;
        defaults.electricMotorTorque = 265;
      }
      
      // Mercedes PHEV specific (C300e, E300e, GLC300e)
      else if (makeLower.includes('mercedes')) {
        defaults.electricRange = 34;
        defaults.batteryCapacity = 13.5;
        defaults.chargingTime = 3.5;
        defaults.homeChargingSpeed = 3.7;
        defaults.electricMotorPower = 90;
        defaults.electricMotorTorque = 440;
      }
      
      // Audi PHEV specific (A3 e-tron, Q5 TFSI e)
      else if (makeLower.includes('audi')) {
        defaults.electricRange = 26;
        defaults.batteryCapacity = 14.1;
        defaults.chargingTime = 4;
        defaults.homeChargingSpeed = 3.6;
        defaults.electricMotorPower = 85;
        defaults.electricMotorTorque = 330;
      }
      
      // Volvo PHEV specific (XC60 T8, XC90 T8)
      else if (makeLower.includes('volvo')) {
        defaults.electricRange = 28;
        defaults.batteryCapacity = 11.6;
        defaults.chargingTime = 3;
        defaults.homeChargingSpeed = 3.7;
        defaults.electricMotorPower = 87;
        defaults.electricMotorTorque = 240;
      }
      
      // Toyota PHEV specific (Prius Plug-in, RAV4 PHEV)
      else if (makeLower.includes('toyota') && modelLower.includes('rav4')) {
        defaults.electricRange = 46;
        defaults.batteryCapacity = 18.1;
        defaults.chargingTime = 5.5;
        defaults.homeChargingSpeed = 3.3;
        defaults.electricMotorPower = 134;
        defaults.electricMotorTorque = 270;
      }
      else if (makeLower.includes('toyota')) {
        defaults.electricRange = 39;
        defaults.batteryCapacity = 13.6;
        defaults.chargingTime = 4.5;
        defaults.homeChargingSpeed = 3.3;
        defaults.electricMotorPower = 72;
        defaults.electricMotorTorque = 207;
      }
      
      // Mitsubishi Outlander PHEV
      else if (makeLower.includes('mitsubishi') && modelLower.includes('outlander')) {
        defaults.electricRange = 28;
        defaults.batteryCapacity = 13.8;
        defaults.chargingTime = 4.5;
        defaults.homeChargingSpeed = 3.6;
        defaults.electricMotorPower = 60;
        defaults.electricMotorTorque = 195;
      }
    } else {
      // ── Regular Hybrid (Self-Charging) Defaults ──────────────────────────
      // These typically have very small batteries and no plug-in capability
      defaults = {
        electricRange: 2, // Self-charging hybrids have minimal electric-only range
        batteryCapacity: 1.5, // Small battery (1-2 kWh typical)
        chargingTime: 0, // No external charging
        homeChargingSpeed: 0,
        publicChargingSpeed: 0,
        rapidChargingSpeed: 0,
        chargingTime10to80: 0,
        electricMotorPower: 50, // Smaller electric motor
        electricMotorTorque: 163,
        chargingPortType: 'N/A (Self-Charging)',
        fastChargingCapability: 'Not Applicable (Self-Charging Hybrid)'
      };
      
      // Toyota Hybrid specific (Prius, Corolla, RAV4, Camry)
      if (makeLower.includes('toyota')) {
        defaults.batteryCapacity = 1.3;
        defaults.electricMotorPower = 72;
        defaults.electricMotorTorque = 163;
      }
      
      // Honda Hybrid specific (CR-V, Jazz, Civic)
      else if (makeLower.includes('honda')) {
        defaults.batteryCapacity = 1.0;
        defaults.electricMotorPower = 135;
        defaults.electricMotorTorque = 315;
      }
      
      // Lexus Hybrid specific
      else if (makeLower.includes('lexus')) {
        defaults.batteryCapacity = 1.6;
        defaults.electricMotorPower = 88;
        defaults.electricMotorTorque = 202;
      }
      
      // Hyundai/Kia Hybrid specific
      else if (makeLower.includes('hyundai') || makeLower.includes('kia')) {
        defaults.batteryCapacity = 1.5;
        defaults.electricMotorPower = 44;
        defaults.electricMotorTorque = 170;
      }
    }
    
    return defaults;
  }

  /**
   * Populate missing vehicle data automatically
   * @param {Object} carData - Car data object
   * @returns {Object} Enhanced car data with populated fields
   */
  static populateMissingData(carData) {
    const fuelType = carData.fuelType || '';
    const fuelTypeLower = fuelType.toLowerCase();
    
    // Check if it's an electric or hybrid vehicle
    const isElectric = fuelTypeLower === 'electric';
    const isHybrid = fuelTypeLower.includes('hybrid');
    const isPlugInHybrid = fuelTypeLower.includes('plug-in');
    
    // ── Handle Electric Vehicles ──────────────────────────────────────────
    if (isElectric) {
      const evDefaults = this.getElectricVehicleDefaults(carData.make, carData.model, carData.year);
      
      // Populate missing EV fields
      Object.keys(evDefaults).forEach(key => {
        if (!carData[key] && !carData.runningCosts?.[key]) {
          carData[key] = evDefaults[key];
          
          // Also add to runningCosts object
          if (!carData.runningCosts) {
            carData.runningCosts = {};
          }
          carData.runningCosts[key] = evDefaults[key];
        }
      });
      
      // Set electric vehicle specific values
      carData.co2Emissions = 0;
      carData.annualTax = 0;
      if (carData.runningCosts) {
        carData.runningCosts.co2Emissions = 0;
        carData.runningCosts.annualTax = 0;
      }
    }
    
    // ── Handle Hybrid Vehicles ────────────────────────────────────────────
    else if (isHybrid) {
      const hybridDefaults = this.getHybridVehicleDefaults(carData.make, carData.model, fuelType);
      
      // Populate missing hybrid fields
      Object.keys(hybridDefaults).forEach(key => {
        if (!carData[key] && !carData.runningCosts?.[key]) {
          carData[key] = hybridDefaults[key];
          
          // Also add to runningCosts object
          if (!carData.runningCosts) {
            carData.runningCosts = {};
          }
          carData.runningCosts[key] = hybridDefaults[key];
        }
      });
      
      // Hybrids still have some CO2 emissions (unless it's a PHEV in electric mode)
      // Don't override if already set from API
      if (!carData.co2Emissions && isPlugInHybrid) {
        carData.co2Emissions = 30; // Typical PHEV CO2 emissions
      }
      
      console.log(`✅ [AutoDataPopulation] Added hybrid vehicle data for ${carData.make} ${carData.model} (${fuelType})`);
    }
    
    return carData;
  }
}

module.exports = AutoDataPopulationService;