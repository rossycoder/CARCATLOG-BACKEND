/**
 * Test Emission Class Fix
 * Tests that emission class is properly fetched from API and saved to database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const UniversalAutoCompleteService = require('../services/universalAutoCompleteService');

async function testEmissionClassFix() {
  try {
    console.log('🧪 Testing Emission Class Fix\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Test VRMs
    const testVRMs = [
      'NU10YEV',  // SKODA OCTAVIA
      'BG22UCP',  // BMW i4 Electric
      'EK11XHZ'   // HONDA CIVIC
    ];
    
    const universalService = new UniversalAutoCompleteService();
    
    for (const vrm of testVRMs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing VRM: ${vrm}`);
      console.log('='.repeat(60));
      
      // Find car in database
      const car = await Car.findOne({ registrationNumber: vrm });
      
      if (!car) {
        console.log(`⚠️  Car not found in database: ${vrm}`);
        continue;
      }
      
      console.log(`\n📋 Current Car Data:`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Combined MPG: ${car.combinedMpg || 'NULL'}`);
      console.log(`   CO2 Emissions: ${car.co2Emissions || 'NULL'}`);
      console.log(`   Insurance Group: ${car.insuranceGroup || 'NULL'}`);
      console.log(`   Emission Class: ${car.emissionClass || 'NULL'}`);
      console.log(`   Running Costs Object: ${car.runningCosts ? 'EXISTS' : 'NULL'}`);
      
      if (car.runningCosts) {
        console.log(`     - Combined MPG: ${car.runningCosts.fuelEconomy?.combined || 'NULL'}`);
        console.log(`     - CO2: ${car.runningCosts.co2Emissions || 'NULL'}`);
        console.log(`     - Insurance: ${car.runningCosts.insuranceGroup || 'NULL'}`);
        console.log(`     - Emission Class: ${car.runningCosts.emissionClass || 'NULL'}`);
      }
      
      // Check VehicleHistory cache
      const cachedData = await VehicleHistory.findOne({ vrm: vrm }).sort({ checkDate: -1 });
      
      if (cachedData) {
        const cacheAge = Math.floor((Date.now() - new Date(cachedData.checkDate).getTime()) / (24 * 60 * 60 * 1000));
        console.log(`\n📦 Cached Data (${cacheAge} days old):`);
        console.log(`   Combined MPG: ${cachedData.combinedMpg || 'NULL'}`);
        console.log(`   CO2 Emissions: ${cachedData.co2Emissions || 'NULL'}`);
        console.log(`   Insurance Group: ${cachedData.insuranceGroup || 'NULL'}`);
        console.log(`   Emission Class: ${cachedData.emissionClass || 'NULL'}`);
      } else {
        console.log(`\n📭 No cached data found`);
      }
      
      // Run Universal Service to fetch fresh data
      console.log(`\n🔄 Running Universal Service to fetch fresh data...`);
      
      try {
        const result = await universalService.completeCarData(car, true); // Force refresh
        
        console.log(`\n✅ Universal Service completed successfully!`);
        
        // Reload car from database to see saved data
        const updatedCar = await Car.findById(car._id);
        
        console.log(`\n📋 Updated Car Data:`);
        console.log(`   Combined MPG: ${updatedCar.combinedMpg || 'NULL'}`);
        console.log(`   CO2 Emissions: ${updatedCar.co2Emissions || 'NULL'}`);
        console.log(`   Insurance Group: ${updatedCar.insuranceGroup || 'NULL'}`);
        console.log(`   Emission Class: ${updatedCar.emissionClass || 'NULL'} ⭐`);
        console.log(`   Running Costs Object: ${updatedCar.runningCosts ? 'EXISTS' : 'NULL'}`);
        
        if (updatedCar.runningCosts) {
          console.log(`     - Combined MPG: ${updatedCar.runningCosts.fuelEconomy?.combined || 'NULL'}`);
          console.log(`     - CO2: ${updatedCar.runningCosts.co2Emissions || 'NULL'}`);
          console.log(`     - Insurance: ${updatedCar.runningCosts.insuranceGroup || 'NULL'}`);
          console.log(`     - Emission Class: ${updatedCar.runningCosts.emissionClass || 'NULL'} ⭐`);
        }
        
        // Check updated cache
        const updatedCache = await VehicleHistory.findOne({ vrm: vrm }).sort({ checkDate: -1 });
        
        if (updatedCache) {
          console.log(`\n📦 Updated Cache:`);
          console.log(`   Combined MPG: ${updatedCache.combinedMpg || 'NULL'}`);
          console.log(`   CO2 Emissions: ${updatedCache.co2Emissions || 'NULL'}`);
          console.log(`   Insurance Group: ${updatedCache.insuranceGroup || 'NULL'}`);
          console.log(`   Emission Class: ${updatedCache.emissionClass || 'NULL'} ⭐`);
        }
        
        // Verify fix
        const hasEmissionClass = updatedCar.emissionClass || updatedCar.runningCosts?.emissionClass;
        const hasRunningCosts = updatedCar.combinedMpg || updatedCar.runningCosts?.fuelEconomy?.combined;
        
        if (hasEmissionClass && hasRunningCosts) {
          console.log(`\n✅ FIX VERIFIED: Emission class and running costs are now saved!`);
        } else {
          console.log(`\n⚠️  FIX INCOMPLETE:`);
          if (!hasEmissionClass) console.log(`   - Emission class still missing`);
          if (!hasRunningCosts) console.log(`   - Running costs still missing`);
        }
        
      } catch (error) {
        console.error(`\n❌ Universal Service failed:`, error.message);
        console.error(error.stack);
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Test completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Run test
testEmissionClassFix();
