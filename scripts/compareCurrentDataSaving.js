/**
 * Compare Current Data Saving - Check if data is being saved correctly
 * This script will check the BMW 5 Series (YD17AVU) data and compare
 * what's in the database vs what should be there
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

// Import services
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');
const comprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function compareCurrentDataSaving() {
  try {
    console.log('🔍 Starting Current Data Saving Comparison...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testVRM = 'YD17AVU'; // BMW 5 Series from your example
    
    console.log(`📋 Testing VRM: ${testVRM}`);
    console.log('=' .repeat(50));

    // 1. Check what's currently in the database
    console.log('\n1️⃣ CHECKING DATABASE DATA:');
    console.log('-'.repeat(30));
    
    const existingCar = await Car.findOne({ registrationNumber: testVRM });
    const existingHistory = await VehicleHistory.findOne({ vrm: testVRM });
    
    if (existingCar) {
      console.log('✅ Car found in database:');
      console.log(`   Make: ${existingCar.make}`);
      console.log(`   Model: ${existingCar.model}`);
      console.log(`   Variant: ${existingCar.variant}`);
      console.log(`   Year: ${existingCar.year}`);
      console.log(`   Price: £${existingCar.price}`);
      console.log(`   Mileage: ${existingCar.mileage}`);
      console.log(`   Color: ${existingCar.color}`);
      console.log(`   Fuel Type: ${existingCar.fuelType}`);
      console.log(`   Engine Size: ${existingCar.engineSize}L`);
      console.log(`   CO2 Emissions: ${existingCar.co2Emissions}g/km`);
      console.log(`   Body Type: ${existingCar.bodyType}`);
      console.log(`   Doors: ${existingCar.doors}`);
      console.log(`   Seats: ${existingCar.seats}`);
      
      // Running costs
      if (existingCar.runningCosts) {
        console.log('\n   Running Costs:');
        console.log(`     Urban MPG: ${existingCar.runningCosts.fuelEconomy?.urban || existingCar.fuelEconomyUrban}`);
        console.log(`     Extra Urban MPG: ${existingCar.runningCosts.fuelEconomy?.extraUrban || existingCar.fuelEconomyExtraUrban}`);
        console.log(`     Combined MPG: ${existingCar.runningCosts.fuelEconomy?.combined || existingCar.fuelEconomyCombined}`);
        console.log(`     Annual Tax: £${existingCar.runningCosts.annualTax || existingCar.annualTax}`);
        console.log(`     Insurance Group: ${existingCar.runningCosts.insuranceGroup || existingCar.insuranceGroup || 'Not available'}`);
      }
    } else {
      console.log('❌ Car NOT found in database');
    }

    if (existingHistory) {
      console.log('\n✅ Vehicle History found in database:');
      console.log(`   Previous Owners: ${existingHistory.numberOfPreviousKeepers || existingHistory.previousOwners}`);
      console.log(`   Write-off Status: ${existingHistory.isWrittenOff ? 'YES' : 'NO'}`);
      console.log(`   Write-off Category: ${existingHistory.writeOffCategory || 'None'}`);
      console.log(`   Outstanding Finance: ${existingHistory.hasOutstandingFinance ? 'YES' : 'NO'}`);
      console.log(`   Stolen: ${existingHistory.isStolen ? 'YES' : 'NO'}`);
      console.log(`   Plate Changes: ${existingHistory.plateChanges || 0}`);
      console.log(`   Color Changes: ${existingHistory.colourChanges || 0}`);
      console.log(`   V5C Certificates: ${existingHistory.v5cCertificateCount || 0}`);
      
      // Valuation
      if (existingHistory.valuation) {
        console.log('\n   Valuation:');
        console.log(`     Private: £${existingHistory.valuation.privatePrice || 'N/A'}`);
        console.log(`     Dealer: £${existingHistory.valuation.dealerPrice || 'N/A'}`);
        console.log(`     Part Exchange: £${existingHistory.valuation.partExchangePrice || 'N/A'}`);
      }
    } else {
      console.log('❌ Vehicle History NOT found in database');
    }

    // 2. Fetch fresh data from API
    console.log('\n\n2️⃣ FETCHING FRESH API DATA:');
    console.log('-'.repeat(30));
    
    try {
      const freshData = await checkCarDetailsClient.getVehicleData(testVRM);
      console.log('✅ Fresh API data retrieved:');
      console.log(`   Make: ${freshData.make}`);
      console.log(`   Model: ${freshData.model}`);
      console.log(`   Variant: ${freshData.variant}`);
      console.log(`   Year: ${freshData.year}`);
      console.log(`   Color: ${freshData.color}`);
      console.log(`   Fuel Type: ${freshData.fuelType}`);
      console.log(`   Engine Size: ${freshData.engineSize}L`);
      console.log(`   CO2 Emissions: ${freshData.co2Emissions}g/km`);
      console.log(`   Body Type: ${freshData.bodyType}`);
      console.log(`   Doors: ${freshData.doors}`);
      console.log(`   Seats: ${freshData.seats}`);
      
      // Running costs
      if (freshData.fuelEconomy) {
        console.log('\n   Running Costs:');
        console.log(`     Urban MPG: ${freshData.fuelEconomy.urban}`);
        console.log(`     Extra Urban MPG: ${freshData.fuelEconomy.extraUrban}`);
        console.log(`     Combined MPG: ${freshData.fuelEconomy.combined}`);
        console.log(`     Annual Tax: £${freshData.annualTax}`);
        console.log(`     Insurance Group: ${freshData.insuranceGroup || 'Not available'}`);
      }
    } catch (error) {
      console.log(`❌ Failed to fetch fresh API data: ${error.message}`);
    }

    // 3. Test comprehensive vehicle service
    console.log('\n\n3️⃣ TESTING COMPREHENSIVE VEHICLE SERVICE:');
    console.log('-'.repeat(45));
    
    try {
      const comprehensiveData = await comprehensiveVehicleService.getCompleteVehicleData(testVRM, 2500);
      console.log('✅ Comprehensive service data:');
      console.log(`   Make: ${comprehensiveData.vehicleData?.make}`);
      console.log(`   Model: ${comprehensiveData.vehicleData?.model}`);
      console.log(`   Variant: ${comprehensiveData.vehicleData?.variant}`);
      console.log(`   Previous Owners: ${comprehensiveData.historyData?.numberOfPreviousKeepers}`);
      console.log(`   Write-off Category: ${comprehensiveData.historyData?.writeOffCategory}`);
      console.log(`   Private Value: £${comprehensiveData.historyData?.valuation?.privatePrice}`);
    } catch (error) {
      console.log(`❌ Comprehensive service failed: ${error.message}`);
    }

    // 4. Data comparison
    console.log('\n\n4️⃣ DATA COMPARISON ANALYSIS:');
    console.log('-'.repeat(35));
    
    if (existingCar && existingHistory) {
      console.log('✅ GOOD: Both car and history data exist in database');
      
      // Check key fields
      const issues = [];
      
      if (!existingCar.make || existingCar.make === 'Unknown') {
        issues.push('❌ Make is missing or unknown');
      }
      
      if (!existingCar.model || existingCar.model === 'Unknown') {
        issues.push('❌ Model is missing or unknown');
      }
      
      if (!existingCar.variant) {
        issues.push('❌ Variant is missing');
      }
      
      if (!existingCar.fuelEconomyUrban && !existingCar.runningCosts?.fuelEconomy?.urban) {
        issues.push('❌ Urban MPG is missing');
      }
      
      if (!existingCar.annualTax && !existingCar.runningCosts?.annualTax) {
        issues.push('❌ Annual tax is missing');
      }
      
      if (!existingHistory.numberOfPreviousKeepers && !existingHistory.previousOwners) {
        issues.push('❌ Previous owners count is missing');
      }
      
      if (!existingHistory.valuation?.privatePrice) {
        issues.push('❌ Private valuation is missing');
      }
      
      if (issues.length === 0) {
        console.log('🎉 EXCELLENT: All key data fields are present and correct!');
      } else {
        console.log('⚠️  ISSUES FOUND:');
        issues.forEach(issue => console.log(`   ${issue}`));
      }
    } else {
      console.log('❌ PROBLEM: Missing car or history data in database');
    }

    // 5. Recommendations
    console.log('\n\n5️⃣ RECOMMENDATIONS:');
    console.log('-'.repeat(25));
    
    if (existingCar && existingHistory) {
      console.log('✅ Current API setup is working well');
      console.log('✅ Data is being saved correctly');
      console.log('✅ Both vehicle specs and history are complete');
      console.log('\n💡 Before switching to new API:');
      console.log('   1. Test new API with same VRM (YD17AVU)');
      console.log('   2. Compare data completeness');
      console.log('   3. Check if new API provides write-off categories');
      console.log('   4. Verify valuation accuracy');
      console.log('   5. Calculate cost savings');
    } else {
      console.log('⚠️  Current data saving has issues');
      console.log('💡 Need to fix current system before considering switch');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Comparison completed successfully!');

  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the comparison
if (require.main === module) {
  compareCurrentDataSaving();
}

module.exports = { compareCurrentDataSaving };