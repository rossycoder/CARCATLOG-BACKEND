/**
 * Automatic Data Population Service
 * Ensures ALL cars have complete data and no important fields are null
 */

const EnhancedVehicleService = require('./enhancedVehicleService');
const ApiResponseUnwrapper = require('../utils/apiResponseUnwrapper');
const CarDataNormalizer = require('../utils/carDataNormalizer');

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
    
    // Generic electric vehicle defaults for unknown makes/models
    
    return defaults;
  }

  /**
   * Populate missing vehicle data automatically
   * @param {Object} carData - Car data object
   * @returns {Object} Enhanced car data with populated fields
   */
  static populateMissingData(carData) {
    // If it's an electric vehicle, add EV-specific data
    if (carData.fuelType === 'Electric') {
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
    
    return carData;
  }
}

module.exports = AutoDataPopulationService;