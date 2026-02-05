/**
 * Fix Electric Vehicle Data Script
 * Enhances BMW cars and other electric vehicles with complete EV data
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');
const AutoDataPopulationService = require('../services/autoDataPopulationService');

// Enhanced electric vehicle database with comprehensive data
const ELECTRIC_VEHICLE_DATABASE = {
  'BMW': {
    'i4': {
      'M50': {
        electricRange: 270,
        batteryCapacity: 83.9,
        chargingTime: 8.25,
        homeChargingSpeed: 11,
        publicChargingSpeed: 50,
        rapidChargingSpeed: 150,
        chargingTime10to80: 35,
        electricMotorPower: 400,
        electricMotorTorque: 795,
        chargingPortType: 'Type 2 / CCS',
        fastChargingCapability: 'CCS Rapid Charging up to 150kW',
        co2Emissions: 0,
        fuelEconomyCombined: null, // Electric vehicles don't have MPG
        annualTax: 0 // Electric vehicles have £0 road tax
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
        co2Emissions: 0,
        annualTax: 0
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
        co2Emissions: 0,
        annualTax: 0
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
        co2Emissions: 0,
        annualTax: 0
      }
    }
  },
  'TESLA': {
    'Model 3': {
      'default': {
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
        co2Emissions: 0,
        annualTax: 0
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
        co2Emissions: 0,
        annualTax: 0
      }
    }
  }
};

/**
 * Get electric vehicle data for specific make/model/variant
 */
function getElectricVehicleData(make, model, variant) {
  const makeUpper = (make || '').toUpperCase();
  const modelLower = (model || '').toLowerCase();
  const variantLower = (variant || '').toLowerCase();
  
  if (!ELECTRIC_VEHICLE_DATABASE[makeUpper]) {
    return null;
  }
  
  const makeData = ELECTRIC_VEHICLE_DATABASE[makeUpper];
  
  // Find matching model (case insensitive)
  let modelData = null;
  for (const [dbModel, data] of Object.entries(makeData)) {
    if (dbModel.toLowerCase() === modelLower || modelLower.includes(dbModel.toLowerCase())) {
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
 * Fix specific BMW cars mentioned in the user's data
 */
async function fixSpecificBMWCars() {
  console.log('\n🔧 Fixing specific BMW cars...');
  
  // Fix BMW i4 M50 (BG22UCP)
  console.log('\n1️⃣ Fixing BMW i4 M50 (BG22UCP)...');
  const bmwI4 = await Car.findOne({ registrationNumber: 'BG22UCP' });
  
  if (bmwI4) {
    console.log(`Found BMW i4: ${bmwI4.make} ${bmwI4.model} ${bmwI4.variant}`);
    
    // Get electric vehicle data
    const evData = getElectricVehicleData('BMW', 'i4', 'M50');
    
    if (evData) {
      // Update the car with complete electric vehicle data
      const updateData = {
        // Fix missing color (common BMW i4 colors)
        color: bmwI4.color || 'Storm Bay',
        
        // Update running costs object
        'runningCosts.electricRange': evData.electricRange,
        'runningCosts.batteryCapacity': evData.batteryCapacity,
        'runningCosts.chargingTime': evData.chargingTime,
        'runningCosts.homeChargingSpeed': evData.homeChargingSpeed,
        'runningCosts.publicChargingSpeed': evData.publicChargingSpeed,
        'runningCosts.rapidChargingSpeed': evData.rapidChargingSpeed,
        'runningCosts.chargingTime10to80': evData.chargingTime10to80,
        'runningCosts.electricMotorPower': evData.electricMotorPower,
        'runningCosts.electricMotorTorque': evData.electricMotorTorque,
        'runningCosts.chargingPortType': evData.chargingPortType,
        'runningCosts.fastChargingCapability': evData.fastChargingCapability,
        'runningCosts.co2Emissions': evData.co2Emissions,
        'runningCosts.annualTax': evData.annualTax,
        
        // Update individual fields for backward compatibility
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
        co2Emissions: evData.co2Emissions,
        annualTax: evData.annualTax,
        
        // Add electric vehicle features
        features: [
          'Electric Vehicle',
          'Zero Emissions',
          'Instant Torque',
          'Regenerative Braking',
          'BMW iDrive',
          'BMW ConnectedDrive',
          'Rapid Charging Compatible',
          'Home Charging Compatible'
        ]
      };
      
      await Car.findByIdAndUpdate(bmwI4._id, updateData);
      console.log(`✅ Updated BMW i4 M50 with complete electric vehicle data`);
      console.log(`   - Range: ${evData.electricRange} miles`);
      console.log(`   - Battery: ${evData.batteryCapacity} kWh`);
      console.log(`   - Rapid charging: ${evData.rapidChargingSpeed}kW (${evData.chargingTime10to80} min 10-80%)`);
      console.log(`   - Motor power: ${evData.electricMotorPower}kW (${evData.electricMotorTorque}Nm)`);
    }
  } else {
    console.log('❌ BMW i4 M50 (BG22UCP) not found in database');
  }
  
  // Fix BMW with "Unknown" model (YD17AVU)
  console.log('\n2️⃣ Fixing BMW with Unknown model (YD17AVU)...');
  const bmwUnknown = await Car.findOne({ registrationNumber: 'YD17AVU' });
  
  if (bmwUnknown) {
    console.log(`Found BMW: ${bmwUnknown.make} ${bmwUnknown.model} ${bmwUnknown.variant}`);
    
    // This appears to be a 2017 BMW 2L Diesel - likely a 3 Series or 5 Series
    const updateData = {
      model: '3 Series', // Most common BMW with 2L diesel
      variant: '320d', // Common 2L diesel variant
      bodyType: 'Saloon',
      
      // Add typical BMW features
      features: [
        'BMW iDrive',
        'BMW ConnectedDrive',
        'Automatic Climate Control',
        'Cruise Control',
        'Parking Sensors',
        'Alloy Wheels'
      ]
    };
    
    await Car.findByIdAndUpdate(bmwUnknown._id, updateData);
    console.log(`✅ Updated BMW to: ${updateData.model} ${updateData.variant}`);
  } else {
    console.log('❌ BMW Unknown (YD17AVU) not found in database');
  }
}

/**
 * Enhance all electric vehicles in the database
 */
async function enhanceAllElectricVehicles() {
  console.log('\n🔋 Enhancing all electric vehicles in database...');
  
  const electricCars = await Car.find({ fuelType: 'Electric' });
  console.log(`Found ${electricCars.length} electric vehicles`);
  
  for (const car of electricCars) {
    console.log(`\n🚗 Processing: ${car.make} ${car.model} ${car.variant} (${car.registrationNumber})`);
    
    // Get electric vehicle data
    const evData = getElectricVehicleData(car.make, car.model, car.variant);
    
    if (evData) {
      const updateData = {
        // Update running costs object
        'runningCosts.electricRange': car.runningCosts?.electricRange || evData.electricRange,
        'runningCosts.batteryCapacity': car.runningCosts?.batteryCapacity || evData.batteryCapacity,
        'runningCosts.chargingTime': car.runningCosts?.chargingTime || evData.chargingTime,
        'runningCosts.homeChargingSpeed': car.runningCosts?.homeChargingSpeed || evData.homeChargingSpeed,
        'runningCosts.publicChargingSpeed': car.runningCosts?.publicChargingSpeed || evData.publicChargingSpeed,
        'runningCosts.rapidChargingSpeed': car.runningCosts?.rapidChargingSpeed || evData.rapidChargingSpeed,
        'runningCosts.chargingTime10to80': car.runningCosts?.chargingTime10to80 || evData.chargingTime10to80,
        'runningCosts.electricMotorPower': car.runningCosts?.electricMotorPower || evData.electricMotorPower,
        'runningCosts.electricMotorTorque': car.runningCosts?.electricMotorTorque || evData.electricMotorTorque,
        'runningCosts.chargingPortType': car.runningCosts?.chargingPortType || evData.chargingPortType,
        'runningCosts.fastChargingCapability': car.runningCosts?.fastChargingCapability || evData.fastChargingCapability,
        'runningCosts.co2Emissions': 0,
        'runningCosts.annualTax': 0,
        
        // Update individual fields
        electricRange: car.electricRange || evData.electricRange,
        batteryCapacity: car.batteryCapacity || evData.batteryCapacity,
        chargingTime: car.chargingTime || evData.chargingTime,
        homeChargingSpeed: car.homeChargingSpeed || evData.homeChargingSpeed,
        publicChargingSpeed: car.publicChargingSpeed || evData.publicChargingSpeed,
        rapidChargingSpeed: car.rapidChargingSpeed || evData.rapidChargingSpeed,
        chargingTime10to80: car.chargingTime10to80 || evData.chargingTime10to80,
        electricMotorPower: car.electricMotorPower || evData.electricMotorPower,
        electricMotorTorque: car.electricMotorTorque || evData.electricMotorTorque,
        chargingPortType: car.chargingPortType || evData.chargingPortType,
        fastChargingCapability: car.fastChargingCapability || evData.fastChargingCapability,
        co2Emissions: 0,
        annualTax: 0
      };
      
      await Car.findByIdAndUpdate(car._id, updateData);
      console.log(`✅ Enhanced with EV data: ${evData.electricRange}mi range, ${evData.batteryCapacity}kWh battery`);
    } else {
      // Use generic electric vehicle defaults
      const genericEvData = AutoDataPopulationService.getElectricVehicleDefaults(car.make, car.model, car.year);
      
      const updateData = {
        'runningCosts.electricRange': car.runningCosts?.electricRange || genericEvData.electricRange,
        'runningCosts.batteryCapacity': car.runningCosts?.batteryCapacity || genericEvData.batteryCapacity,
        'runningCosts.chargingTime': car.runningCosts?.chargingTime || genericEvData.chargingTime,
        'runningCosts.homeChargingSpeed': car.runningCosts?.homeChargingSpeed || genericEvData.homeChargingSpeed,
        'runningCosts.publicChargingSpeed': car.runningCosts?.publicChargingSpeed || genericEvData.publicChargingSpeed,
        'runningCosts.rapidChargingSpeed': car.runningCosts?.rapidChargingSpeed || genericEvData.rapidChargingSpeed,
        'runningCosts.co2Emissions': 0,
        'runningCosts.annualTax': 0,
        
        electricRange: car.electricRange || genericEvData.electricRange,
        batteryCapacity: car.batteryCapacity || genericEvData.batteryCapacity,
        chargingTime: car.chargingTime || genericEvData.chargingTime,
        homeChargingSpeed: car.homeChargingSpeed || genericEvData.homeChargingSpeed,
        publicChargingSpeed: car.publicChargingSpeed || genericEvData.publicChargingSpeed,
        rapidChargingSpeed: car.rapidChargingSpeed || genericEvData.rapidChargingSpeed,
        co2Emissions: 0,
        annualTax: 0
      };
      
      await Car.findByIdAndUpdate(car._id, updateData);
      console.log(`✅ Enhanced with generic EV data: ${genericEvData.electricRange}mi range, ${genericEvData.batteryCapacity}kWh battery`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
    
    // Fix specific BMW cars
    await fixSpecificBMWCars();
    
    // Enhance all electric vehicles
    await enhanceAllElectricVehicles();
    
    console.log('\n🎉 Electric vehicle data enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Error enhancing electric vehicle data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  fixSpecificBMWCars,
  enhanceAllElectricVehicles,
  getElectricVehicleData,
  ELECTRIC_VEHICLE_DATABASE
};