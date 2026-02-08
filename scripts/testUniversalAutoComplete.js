const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');

async function testUniversalAutoComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    console.log('=== TESTING UNIVERSAL AUTO-COMPLETE ===');
    console.log('Creating a new car to test automatic data population\n');

    // Create a test car with minimal data
    const testCar = new Car({
      registrationNumber: 'BG22UCP', // Known working VRM
      make: 'BMW',
      model: '3 Series',
      year: 2022,
      fuelType: 'Petrol',
      price: 25000,
      mileage: 15000,
      status: 'active',
      
      // Required fields
      postcode: 'M1 1AA',
      description: 'Test car for universal auto-complete',
      transmission: 'automatic',
      color: 'Black'
    });

    console.log('🚗 BEFORE SAVE (minimal data):');
    console.log(`   Registration: ${testCar.registrationNumber}`);
    console.log(`   Make/Model: ${testCar.make} ${testCar.model}`);
    console.log(`   Variant: ${testCar.variant || 'Missing'}`);
    console.log(`   Engine Size: ${testCar.engineSize || 'Missing'}`);
    console.log(`   Doors: ${testCar.doors || 'Missing'}`);
    console.log(`   Seats: ${testCar.seats || 'Missing'}`);
    console.log(`   Urban MPG: ${testCar.urbanMpg || 'Missing'}`);
    console.log(`   Combined MPG: ${testCar.combinedMpg || 'Missing'}`);
    console.log(`   Annual Tax: ${testCar.annualTax || 'Missing'}`);
    console.log(`   CO2 Emissions: ${testCar.co2Emissions || 'Missing'}`);
    console.log(`   MOT Status: ${testCar.motStatus || 'Missing'}`);
    console.log(`   MOT Due: ${testCar.motDue || 'Missing'}`);
    console.log(`   Running Costs: ${testCar.runningCosts ? 'Present' : 'Missing'}`);

    console.log('\n💾 SAVING CAR (this will trigger universal auto-complete)...');
    await testCar.save();

    console.log('\n⏳ Waiting 5 seconds for background auto-complete to finish...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch the updated car from database
    console.log('\n🔍 FETCHING UPDATED CAR FROM DATABASE...');
    const updatedCar = await Car.findById(testCar._id).populate('historyCheckId');

    console.log('\n🚗 AFTER AUTO-COMPLETE (should have complete data):');
    console.log(`   Registration: ${updatedCar.registrationNumber}`);
    console.log(`   Make/Model: ${updatedCar.make} ${updatedCar.model}`);
    console.log(`   Variant: ${updatedCar.variant || 'Still Missing ❌'}`);
    console.log(`   Engine Size: ${updatedCar.engineSize || 'Still Missing ❌'}`);
    console.log(`   Doors: ${updatedCar.doors || 'Still Missing ❌'}`);
    console.log(`   Seats: ${updatedCar.seats || 'Still Missing ❌'}`);
    console.log(`   Urban MPG: ${updatedCar.urbanMpg || 'Still Missing ❌'}`);
    console.log(`   Combined MPG: ${updatedCar.combinedMpg || 'Still Missing ❌'}`);
    console.log(`   Annual Tax: £${updatedCar.annualTax || 'Still Missing ❌'}`);
    console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'Still Missing ❌'}g/km`);
    console.log(`   MOT Status: ${updatedCar.motStatus || 'Still Missing ❌'}`);
    console.log(`   MOT Due: ${updatedCar.motDue ? updatedCar.motDue.toLocaleDateString('en-GB') : 'Still Missing ❌'}`);
    console.log(`   Running Costs: ${updatedCar.runningCosts ? 'Present ✅' : 'Still Missing ❌'}`);

    if (updatedCar.runningCosts) {
      console.log('\n🔧 RUNNING COSTS DETAILS:');
      console.log(`   Urban MPG: ${updatedCar.runningCosts.fuelEconomy?.urban || 'N/A'}`);
      console.log(`   Combined MPG: ${updatedCar.runningCosts.fuelEconomy?.combined || 'N/A'}`);
      console.log(`   CO2 Emissions: ${updatedCar.runningCosts.co2Emissions || 'N/A'}g/km`);
      console.log(`   Annual Tax: £${updatedCar.runningCosts.annualTax || 'N/A'}`);
      console.log(`   Insurance Group: ${updatedCar.runningCosts.insuranceGroup || 'N/A'}`);
    }

    if (updatedCar.historyCheckId) {
      console.log('\n📋 VEHICLE HISTORY:');
      console.log(`   Previous Owners: ${updatedCar.historyCheckId.numberOfPreviousKeepers || 0}`);
      console.log(`   Write Off Category: ${updatedCar.historyCheckId.writeOffCategory || 'none'}`);
      console.log(`   Exported: ${updatedCar.historyCheckId.exported || false}`);
      console.log(`   Scrapped: ${updatedCar.historyCheckId.scrapped || false}`);
    }

    // Check completeness
    const criticalFields = [
      'variant', 'engineSize', 'doors', 'seats', 'urbanMpg', 
      'combinedMpg', 'annualTax', 'co2Emissions', 'motStatus'
    ];

    const missingFields = criticalFields.filter(field => !updatedCar[field]);
    const completeness = Math.round(((criticalFields.length - missingFields.length) / criticalFields.length) * 100);

    console.log('\n=== COMPLETENESS ANALYSIS ===');
    console.log(`Data Completeness: ${completeness}%`);
    console.log(`Complete Fields: ${criticalFields.length - missingFields.length}/${criticalFields.length}`);
    
    if (missingFields.length > 0) {
      console.log(`Missing Fields: ${missingFields.join(', ')}`);
    }

    if (completeness >= 90) {
      console.log('\n🎉 SUCCESS! Universal auto-complete is working correctly!');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS - Some fields still missing');
    }

    // Clean up - delete test car
    console.log('\n🗑️  CLEANING UP...');
    await Car.findByIdAndDelete(testCar._id);
    
    if (updatedCar.historyCheckId) {
      const VehicleHistory = require('../models/VehicleHistory');
      await VehicleHistory.findByIdAndDelete(updatedCar.historyCheckId._id);
    }
    
    console.log('   Test car and history deleted');

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testUniversalAutoComplete();