const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const User = require('../models/User');

async function debugFrontendHistoryIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user's car
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    const userCar = await Car.findOne({ userId: testUser._id }).populate('historyCheckId');
    
    console.log('🔍 DEBUGGING FRONTEND HISTORY ISSUE');
    console.log('=====================================');
    
    console.log('\n1. RAW CAR DATA:');
    console.log('   Car ID:', userCar._id);
    console.log('   Registration:', userCar.registrationNumber);
    console.log('   historyCheckId type:', typeof userCar.historyCheckId);
    console.log('   historyCheckId exists:', !!userCar.historyCheckId);
    
    console.log('\n2. HISTORY CHECK ID DETAILS:');
    if (userCar.historyCheckId) {
      console.log('   Is Object:', typeof userCar.historyCheckId === 'object');
      console.log('   Has _id:', !!userCar.historyCheckId._id);
      console.log('   VRM:', userCar.historyCheckId.vrm);
      console.log('   Previous Owners:', userCar.historyCheckId.numberOfPreviousKeepers);
      console.log('   Write-off Category:', userCar.historyCheckId.writeOffCategory);
    }
    
    console.log('\n3. FRONTEND COMPONENT SIMULATION:');
    const carData = userCar.toObject(); // Convert to plain object like API does
    console.log('   carData.historyCheckId exists:', !!carData.historyCheckId);
    console.log('   carData.historyCheckId type:', typeof carData.historyCheckId);
    
    if (carData.historyCheckId) {
      console.log('   ✅ Component should show history data');
      console.log('   Previous Owners:', carData.historyCheckId.numberOfPreviousKeepers || 'N/A');
      console.log('   Keys:', carData.historyCheckId.numberOfKeys || carData.historyCheckId.keys || 'N/A');
      console.log('   Write-off Category:', carData.historyCheckId.writeOffCategory || 'none');
    } else {
      console.log('   ❌ Component will show "not available" message');
    }
    
    console.log('\n4. EXACT FRONTEND LOGIC TEST:');
    // Simulate the exact logic from VehicleHistorySection
    if (carData && carData.historyCheckId) {
      console.log('   ✅ PASS: carData && carData.historyCheckId');
      console.log('   Component will call: setHistoryData(carData.historyCheckId)');
      console.log('   Component will call: setIsLoading(false)');
      console.log('   Component will return early (no error)');
    } else {
      console.log('   ❌ FAIL: carData && carData.historyCheckId');
      console.log('   Component will set error message');
      console.log('   User will see: "Vehicle history information is not available"');
    }
    
    console.log('\n5. WRITE-OFF BADGE TEST:');
    if (carData.historyCheckId && 
        carData.historyCheckId.writeOffCategory && 
        ['A', 'B', 'S', 'N', 'D'].includes(carData.historyCheckId.writeOffCategory.toUpperCase())) {
      console.log(`   ✅ Should show write-off badge: CAT ${carData.historyCheckId.writeOffCategory.toUpperCase()}`);
    } else {
      console.log('   ❌ No write-off badge will be shown');
    }
    
    console.log('\n6. POSSIBLE ISSUES:');
    console.log('   - Frontend might not be receiving populated data');
    console.log('   - API response might be different than expected');
    console.log('   - Component might have caching issues');
    console.log('   - Browser console should show the actual carData being passed');
    
    console.log('\n✅ Debug completed - check browser console for actual frontend data!');

  } catch (error) {
    console.error('❌ Error debugging frontend history issue:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugFrontendHistoryIssue();