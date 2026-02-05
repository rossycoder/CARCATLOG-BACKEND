/**
 * Test Running Costs Auto-Save
 * Tests that running costs are automatically saved when comprehensive service is called
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testRunningCostsAutoSave() {
  try {
    console.log('🧪 Testing Running Costs Auto-Save System\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test VRM - use a car that exists in database
    const testVRM = 'EX09MYY'; // Honda Civic
    
    console.log(`📋 Test VRM: ${testVRM}\n`);
    
    // Step 1: Check current car state
    console.log('1️⃣ Checking current car state...');
    let car = await Car.findOne({ registrationNumber: testVRM });
    
    if (!car) {
      console.log('❌ Car not found in database');
      process.exit(1);
    }
    
    console.log(`   Car ID: ${car._id}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Current Running Costs:`);
    console.log(`     MPG Urban: ${car.fuelEconomyUrban || 'NULL'}`);
    console.log(`     MPG Extra Urban: ${car.fuelEconomyExtraUrban || 'NULL'}`);
    console.log(`     MPG Combined: ${car.fuelEconomyCombined || 'NULL'}`);
    console.log(`     CO2: ${car.co2Emissions || 'NULL'}`);
    console.log(`     Insurance Group: ${car.insuranceGroup || 'NULL'}`);
    console.log(`     Annual Tax: ${car.annualTax || 'NULL'}`);
    console.log('');
    
    // Step 2: Check VehicleHistory state
    console.log('2️⃣ Checking VehicleHistory state...');
    let vehicleHistory = await VehicleHistory.findOne({ 
      vrm: testVRM.toUpperCase().replace(/\s/g, '') 
    });
    
    if (vehicleHistory) {
      console.log(`   VehicleHistory ID: ${vehicleHistory._id}`);
      console.log(`   Running Costs in VehicleHistory:`);
      console.log(`     urbanMpg: ${vehicleHistory.urbanMpg || 'NULL'}`);
      console.log(`     extraUrbanMpg: ${vehicleHistory.extraUrbanMpg || 'NULL'}`);
      console.log(`     combinedMpg: ${vehicleHistory.combinedMpg || 'NULL'}`);
      console.log(`     co2Emissions: ${vehicleHistory.co2Emissions || 'NULL'}`);
      console.log(`     insuranceGroup: ${vehicleHistory.insuranceGroup || 'NULL'}`);
      console.log(`     annualTax: ${vehicleHistory.annualTax || 'NULL'}`);
    } else {
      console.log('   No VehicleHistory found');
    }
    console.log('');
    
    // Step 3: Call comprehensive service
    console.log('3️⃣ Calling ComprehensiveVehicleService...');
    const comprehensiveService = new ComprehensiveVehicleService();
    
    const result = await comprehensiveService.fetchCompleteVehicleData(
      testVRM,
      car.mileage,
      false // Use cache if available
    );
    
    console.log(`\n   Result:`);
    console.log(`     Success: ${result.success}`);
    console.log(`     API Calls: ${result.apiCalls}`);
    console.log(`     Total Cost: £${result.totalCost.toFixed(2)}`);
    console.log(`     Errors: ${result.errors.length}`);
    console.log('');
    
    // Step 4: Check car state after comprehensive service
    console.log('4️⃣ Checking car state AFTER comprehensive service...');
    car = await Car.findOne({ registrationNumber: testVRM });
    
    console.log(`   Running Costs in Car (AFTER):`);
    console.log(`     MPG Urban: ${car.fuelEconomyUrban || 'NULL'}`);
    console.log(`     MPG Extra Urban: ${car.fuelEconomyExtraUrban || 'NULL'}`);
    console.log(`     MPG Combined: ${car.fuelEconomyCombined || 'NULL'}`);
    console.log(`     CO2: ${car.co2Emissions || 'NULL'}`);
    console.log(`     Insurance Group: ${car.insuranceGroup || 'NULL'}`);
    console.log(`     Annual Tax: ${car.annualTax || 'NULL'}`);
    console.log('');
    
    // Step 5: Verify running costs were saved
    console.log('5️⃣ Verification...');
    
    const hasRunningCosts = car.fuelEconomyUrban || car.fuelEconomyExtraUrban || 
                           car.fuelEconomyCombined || car.co2Emissions || 
                           car.insuranceGroup || car.annualTax;
    
    if (hasRunningCosts) {
      console.log('✅ SUCCESS: Running costs are now saved in database!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`   MPG Combined: ${car.fuelEconomyCombined || 'N/A'}`);
      console.log(`   CO2 Emissions: ${car.co2Emissions || 'N/A'} g/km`);
      console.log(`   Insurance Group: ${car.insuranceGroup || 'N/A'}`);
      console.log(`   Annual Tax: £${car.annualTax || 'N/A'}`);
    } else {
      console.log('❌ FAILED: Running costs are still NULL');
      console.log('');
      console.log('🔍 Debug Info:');
      console.log('   VehicleHistory data:', {
        urbanMpg: vehicleHistory?.urbanMpg,
        extraUrbanMpg: vehicleHistory?.extraUrbanMpg,
        combinedMpg: vehicleHistory?.combinedMpg,
        co2Emissions: vehicleHistory?.co2Emissions,
        insuranceGroup: vehicleHistory?.insuranceGroup,
        annualTax: vehicleHistory?.annualTax
      });
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run test
testRunningCostsAutoSave();
