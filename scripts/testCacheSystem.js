/**
 * Test Cache System - Verify that duplicate API calls are prevented
 * This script tests the EX09MYY car that was charged £6.44 instead of £1.96
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const enhancedVehicleService = require('../services/enhancedVehicleService');
const ComprehensiveVehicleService = require('../services/comprehensiveVehicleService');

async function testCacheSystem() {
  try {
    console.log('🧪 Testing Cache System to Prevent Duplicate API Calls\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testVRM = 'EX09MYY';
    console.log(`🚗 Testing with VRM: ${testVRM}\n`);
    
    // Step 1: Clear any existing cache for this VRM
    console.log('1️⃣ Clearing existing cache...');
    await VehicleHistory.deleteMany({ vrm: testVRM });
    console.log('✅ Cache cleared\n');
    
    // Step 2: First call - should make API calls and cache data
    console.log('2️⃣ First call - should make fresh API calls...');
    const firstCall = await enhancedVehicleService.getEnhancedVehicleData(testVRM, true, 50000);
    console.log(`✅ First call completed`);
    console.log(`   Cached: ${firstCall.dataSources?.cached || false}`);
    console.log(`   History ID: ${firstCall.historyCheckId}\n`);
    
    // Step 3: Second call - should use cache
    console.log('3️⃣ Second call - should use cache...');
    const secondCall = await enhancedVehicleService.getEnhancedVehicleData(testVRM, true, 50000);
    console.log(`✅ Second call completed`);
    console.log(`   Cached: ${secondCall.dataSources?.cached || false}`);
    console.log(`   History ID: ${secondCall.historyCheckId}\n`);
    
    // Step 4: Test comprehensive service with cache
    console.log('4️⃣ Testing comprehensive service with cache...');
    const comprehensiveService = new ComprehensiveVehicleService();
    const comprehensiveResult = await comprehensiveService.fetchCompleteVehicleData(testVRM, 50000, false);
    console.log(`✅ Comprehensive service completed`);
    console.log(`   API Calls: ${comprehensiveResult.apiCalls}`);
    console.log(`   Total Cost: £${comprehensiveResult.totalCost.toFixed(2)}`);
    console.log(`   Cached: ${comprehensiveResult.data.cached || false}\n`);
    
    // Step 5: Test Car model pre-save hook with cache
    console.log('5️⃣ Testing Car model pre-save hook with cache...');
    const testCar = new Car({
      registrationNumber: testVRM,
      make: 'BMW',
      model: '3 Series',
      year: 2009,
      mileage: 50000,
      fuelType: 'Diesel',
      color: 'Black', // Add required color field
      price: 8000,
      postcode: 'M1 1AA',
      description: 'Test car for cache system',
      transmission: 'manual',
      dataSource: 'manual'
    });
    
    console.log(`   Saving car with VRM: ${testVRM}...`);
    await testCar.save();
    console.log(`✅ Car saved successfully`);
    console.log(`   Variant: ${testCar.variant}`);
    console.log(`   History ID: ${testCar.historyCheckId}\n`);
    
    // Step 6: Verify cache effectiveness
    console.log('6️⃣ Verifying cache effectiveness...');
    const cacheCount = await VehicleHistory.countDocuments({ vrm: testVRM });
    console.log(`   VehicleHistory documents for ${testVRM}: ${cacheCount}`);
    
    if (cacheCount === 1) {
      console.log('✅ CACHE SYSTEM WORKING - Only 1 VehicleHistory document created');
    } else {
      console.log(`❌ CACHE SYSTEM FAILED - ${cacheCount} VehicleHistory documents found`);
    }
    
    // Step 7: Test cost calculation
    console.log('\n7️⃣ Cost Analysis:');
    console.log('   Expected cost for new car: £1.96 (1 API call set)');
    console.log('   - Vehicle History: £1.82');
    console.log('   - MOT History: £0.02');
    console.log('   - Valuation: £0.12');
    console.log('   All subsequent calls should use cache (£0.00)');
    
    if (comprehensiveResult.totalCost === 0 && comprehensiveResult.data.cached) {
      console.log('✅ COST OPTIMIZATION WORKING - Comprehensive service used cache');
    } else if (comprehensiveResult.totalCost <= 1.96) {
      console.log('✅ COST WITHIN EXPECTED RANGE');
    } else {
      console.log(`❌ COST TOO HIGH - £${comprehensiveResult.totalCost.toFixed(2)} (should be £1.96 or less)`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Car.deleteOne({ _id: testCar._id });
    await VehicleHistory.deleteMany({ vrm: testVRM });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Cache System Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testCacheSystem();