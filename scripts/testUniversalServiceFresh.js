const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function testUniversalServiceFresh() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    console.log('=== TESTING UNIVERSAL SERVICE WITH FRESH API CALLS ===');
    
    // Find GO14BLU car
    const car = await Car.findOne({ registrationNumber: 'GO14BLU' });
    
    if (!car) {
      console.log('❌ GO14BLU car not found');
      return;
    }

    console.log(`🚗 Testing with car: ${car.registrationNumber}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);

    // Clear cache first
    console.log('\n🗑️  Clearing cache for fresh API calls...');
    await VehicleHistory.deleteMany({ vrm: 'GO14BLU' });
    console.log('   Cache cleared');

    const universalService = new UniversalAutoCompleteService();
    
    console.log('\n🔍 Checking if car needs completion...');
    const needsCompletion = universalService.needsCompletion(car);
    console.log(`   Needs completion: ${needsCompletion}`);

    console.log('\n🚀 Running universal auto-complete service with FRESH API calls...');
    
    const startTime = Date.now();
    const result = await universalService.completeCarData(car, true); // Force refresh
    const endTime = Date.now();
    
    console.log(`✅ Service completed in ${endTime - startTime}ms`);
    
    // Fetch updated car from database
    const updatedCar = await Car.findById(car._id);
    
    console.log('\n📊 DETAILED RESULTS:');
    console.log('='.repeat(50));
    
    console.log('\n🚗 BASIC VEHICLE INFO:');
    console.log(`   Make: ${updatedCar.make}`);
    console.log(`   Model: ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant || 'Missing ❌'}`);
    console.log(`   Year: ${updatedCar.year}`);
    console.log(`   Color: ${updatedCar.color || 'Missing ❌'}`);
    console.log(`   Fuel Type: ${updatedCar.fuelType}`);
    console.log(`   Transmission: ${updatedCar.transmission || 'Missing ❌'}`);
    console.log(`   Body Type: ${updatedCar.bodyType || 'Missing ❌'}`);
    console.log(`   Engine Size: ${updatedCar.engineSize || 'Missing ❌'}`);
    console.log(`   Doors: ${updatedCar.doors || 'Missing ❌'}`);
    console.log(`   Seats: ${updatedCar.seats || 'Missing ❌'}`);
    
    console.log('\n💰 RUNNING COSTS:');
    console.log(`   Urban MPG: ${updatedCar.urbanMpg || 'Missing ❌'}`);
    console.log(`   Extra Urban MPG: ${updatedCar.extraUrbanMpg || 'Missing ❌'}`);
    console.log(`   Combined MPG: ${updatedCar.combinedMpg || 'Missing ❌'}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'Missing ❌'}g/km`);
    console.log(`   Insurance Group: ${updatedCar.insuranceGroup || 'Missing ❌'}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'Missing ❌'}`);
    
    console.log('\n⚡ ELECTRIC VEHICLE DATA:');
    console.log(`   Electric Range: ${updatedCar.electricRange || 'Missing ❌'} miles`);
    console.log(`   Battery Capacity: ${updatedCar.batteryCapacity || 'Missing ❌'} kWh`);
    console.log(`   Charging Time: ${updatedCar.chargingTime || 'Missing ❌'} hours`);
    console.log(`   Home Charging Speed: ${updatedCar.homeChargingSpeed || 'Missing ❌'} kW`);
    console.log(`   Rapid Charging Speed: ${updatedCar.rapidChargingSpeed || 'Missing ❌'} kW`);
    console.log(`   Electric Motor Power: ${updatedCar.electricMotorPower || 'Missing ❌'} kW`);
    console.log(`   Electric Motor Torque: ${updatedCar.electricMotorTorque || 'Missing ❌'} Nm`);
    console.log(`   Charging Port Type: ${updatedCar.chargingPortType || 'Missing ❌'}`);
    
    console.log('\n🏁 PERFORMANCE:');
    console.log(`   Power: ${updatedCar.power || 'Missing ❌'} BHP`);
    console.log(`   Torque: ${updatedCar.torque || 'Missing ❌'} Nm`);
    console.log(`   0-60 mph: ${updatedCar.acceleration || 'Missing ❌'} seconds`);
    console.log(`   Top Speed: ${updatedCar.topSpeed || 'Missing ❌'} mph`);
    
    console.log('\n🔍 MOT DATA:');
    console.log(`   MOT Status: ${updatedCar.motStatus || 'Missing ❌'}`);
    console.log(`   MOT Due: ${updatedCar.motDue ? updatedCar.motDue.toLocaleDateString('en-GB') : 'Missing ❌'}`);
    console.log(`   MOT History: ${updatedCar.motHistory ? updatedCar.motHistory.length : 0} tests`);
    
    console.log('\n💵 VALUATION:');
    console.log(`   Estimated Value: £${updatedCar.estimatedValue?.toLocaleString() || 'Missing ❌'}`);
    console.log(`   Private Price: £${updatedCar.privatePrice?.toLocaleString() || 'Missing ❌'}`);
    console.log(`   Dealer Price: £${updatedCar.dealerPrice?.toLocaleString() || 'Missing ❌'}`);
    console.log(`   Part Exchange: £${updatedCar.partExchangePrice?.toLocaleString() || 'Missing ❌'}`);
    
    console.log('\n🔧 RUNNING COSTS OBJECT:');
    if (updatedCar.runningCosts) {
      console.log('   ✅ Running costs object exists');
      console.log(`   Urban MPG: ${updatedCar.runningCosts.fuelEconomy?.urban || 'N/A'}`);
      console.log(`   Combined MPG: ${updatedCar.runningCosts.fuelEconomy?.combined || 'N/A'}`);
      console.log(`   CO2 Emissions: ${updatedCar.runningCosts.co2Emissions || 'N/A'}g/km`);
      console.log(`   Annual Tax: £${updatedCar.runningCosts.annualTax || 'N/A'}`);
      console.log(`   Electric Range: ${updatedCar.runningCosts.electricRange || 'N/A'} miles`);
      console.log(`   Battery Capacity: ${updatedCar.runningCosts.batteryCapacity || 'N/A'} kWh`);
    } else {
      console.log('   ❌ Running costs object missing');
    }
    
    // Check completeness
    const criticalFields = [
      'variant', 'engineSize', 'doors', 'seats', 'urbanMpg', 
      'combinedMpg', 'annualTax', 'co2Emissions', 'motStatus'
    ];

    const presentFields = criticalFields.filter(field => updatedCar[field] !== null && updatedCar[field] !== undefined);
    const missingFields = criticalFields.filter(field => !updatedCar[field]);
    const completeness = Math.round((presentFields.length / criticalFields.length) * 100);

    console.log('\n=== COMPLETENESS ANALYSIS ===');
    console.log(`Data Completeness: ${completeness}%`);
    console.log(`Present Fields (${presentFields.length}/${criticalFields.length}): ${presentFields.join(', ')}`);
    
    if (missingFields.length > 0) {
      console.log(`Missing Fields (${missingFields.length}/${criticalFields.length}): ${missingFields.join(', ')}`);
    }

    // Final check
    const stillNeedsCompletion = universalService.needsCompletion(updatedCar);
    console.log(`\n🔍 Still needs completion: ${stillNeedsCompletion}`);
    
    if (completeness >= 80) {
      console.log('\n🎉 SUCCESS! Universal service is working well!');
    } else if (completeness >= 50) {
      console.log('\n⚠️  PARTIAL SUCCESS - Most data populated');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT - Many fields still missing');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

testUniversalServiceFresh();