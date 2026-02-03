const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const MOTHistoryService = require('../services/motHistoryService');

// Load environment variables
require('dotenv').config();

// Test MOT history integration
async function testMOTHistoryIntegration() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');

    const testVRM = 'RJ08PFA'; // Use existing test VRM
    
    console.log(`\n🔍 Testing MOT History Integration for: ${testVRM}`);
    console.log('=' .repeat(60));

    // Step 1: Test MOTHistoryService directly
    console.log('\n1. Testing MOTHistoryService.fetchAndSaveMOTHistory()...');
    const motHistoryService = new MOTHistoryService();
    
    try {
      const motResult = await motHistoryService.fetchAndSaveMOTHistory(testVRM, true); // Force refresh
      console.log('✅ MOT History Service Result:', {
        success: motResult.success,
        source: motResult.source,
        count: motResult.count || motResult.data?.length || 0
      });
      
      if (motResult.data && motResult.data.length > 0) {
        console.log('📋 Latest MOT Test:', {
          date: motResult.data[0].testDate,
          result: motResult.data[0].testResult,
          expiry: motResult.data[0].expiryDate,
          mileage: motResult.data[0].odometerValue
        });
      }
    } catch (motError) {
      console.error('❌ MOT History Service Error:', motError.message);
    }

    // Step 2: Check if MOT data was saved to Car document
    console.log('\n2. Checking Car document for MOT history...');
    const car = await Car.findOne({ registrationNumber: testVRM });
    
    if (car) {
      console.log('✅ Car found:', car._id);
      console.log('📊 MOT History in Car:', {
        motHistoryCount: car.motHistory ? car.motHistory.length : 0,
        motStatus: car.motStatus,
        motExpiry: car.motExpiry,
        motDue: car.motDue
      });
      
      if (car.motHistory && car.motHistory.length > 0) {
        console.log('📋 Latest MOT in Car:', {
          date: car.motHistory[0].testDate,
          result: car.motHistory[0].testResult,
          expiry: car.motHistory[0].expiryDate
        });
      } else {
        console.log('⚠️  No MOT history found in Car document');
      }
    } else {
      console.log('❌ Car not found with registration:', testVRM);
    }

    // Step 3: Check if MOT data was saved to VehicleHistory document
    console.log('\n3. Checking VehicleHistory document for MOT history...');
    const vehicleHistory = await VehicleHistory.findOne({ vrm: testVRM });
    
    if (vehicleHistory) {
      console.log('✅ VehicleHistory found:', vehicleHistory._id);
      console.log('📊 MOT History in VehicleHistory:', {
        motHistoryCount: vehicleHistory.motHistory ? vehicleHistory.motHistory.length : 0,
        motStatus: vehicleHistory.motStatus,
        motExpiryDate: vehicleHistory.motExpiryDate
      });
      
      if (vehicleHistory.motHistory && vehicleHistory.motHistory.length > 0) {
        console.log('📋 Latest MOT in VehicleHistory:', {
          date: vehicleHistory.motHistory[0].testDate,
          result: vehicleHistory.motHistory[0].testResult,
          expiry: vehicleHistory.motHistory[0].expiryDate
        });
      } else {
        console.log('⚠️  No MOT history found in VehicleHistory document');
      }
    } else {
      console.log('❌ VehicleHistory not found with VRM:', testVRM);
    }

    // Step 4: Test getCachedMOTHistory method
    console.log('\n4. Testing getCachedMOTHistory method...');
    try {
      const cachedResult = await motHistoryService.getCachedMOTHistory(testVRM);
      console.log('✅ Cached MOT History Result:', {
        success: cachedResult.success,
        source: cachedResult.source,
        count: cachedResult.data?.length || 0
      });
    } catch (cacheError) {
      console.error('❌ Cached MOT History Error:', cacheError.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 MOT History Integration Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testMOTHistoryIntegration();
}

module.exports = testMOTHistoryIntegration;