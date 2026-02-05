const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory'); // Add this import
const User = require('../models/User');

async function testCarDetailAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user's car
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    const userCar = await Car.findOne({ userId: testUser._id });
    
    if (!userCar) {
      console.log('❌ No car found for user');
      return;
    }

    console.log(`🚗 Testing API response for car: ${userCar._id}`);
    console.log(`   Registration: ${userCar.registrationNumber}`);

    // Simulate the API call that the frontend makes
    const carWithHistory = await Car.findById(userCar._id).populate('historyCheckId');
    
    console.log('\n📡 API Response Simulation:');
    console.log('   Car ID:', carWithHistory._id);
    console.log('   Registration:', carWithHistory.registrationNumber);
    console.log('   History Check Status:', carWithHistory.historyCheckStatus);
    console.log('   History Check ID exists:', !!carWithHistory.historyCheckId);
    
    if (carWithHistory.historyCheckId) {
      console.log('\n✅ History Data in API Response:');
      console.log('   Type:', typeof carWithHistory.historyCheckId);
      console.log('   Is Object:', typeof carWithHistory.historyCheckId === 'object');
      console.log('   Has _id:', !!carWithHistory.historyCheckId._id);
      
      if (typeof carWithHistory.historyCheckId === 'object') {
        const history = carWithHistory.historyCheckId;
        console.log('   VRM:', history.vrm);
        console.log('   Previous Owners:', history.numberOfPreviousKeepers || history.previousOwners);
        console.log('   Write-off Category:', history.writeOffCategory);
        console.log('   Is Written Off:', history.isWrittenOff);
        console.log('   Keys:', history.numberOfKeys || history.keys);
        console.log('   Service History:', history.serviceHistory);
        
        // Test what the frontend component checks for
        console.log('\n🔍 Frontend Component Checks:');
        console.log('   carData.historyCheckId exists:', !!carWithHistory.historyCheckId);
        console.log('   carData.historyCheckId is truthy:', !!carWithHistory.historyCheckId);
        console.log('   Should show history data:', !!carWithHistory.historyCheckId);
        
        // Test write-off warning badge logic
        if (history.writeOffCategory && ['A', 'B', 'S', 'N', 'D'].includes(history.writeOffCategory.toUpperCase())) {
          console.log(`   ⚠️  Should show write-off badge: CAT ${history.writeOffCategory.toUpperCase()}`);
        }
      }
    } else {
      console.log('\n❌ No history data in API response');
      console.log('   Frontend will show: "Vehicle history information is not available"');
    }

    // Test the exact structure the frontend expects
    console.log('\n📋 Frontend Expected Structure:');
    const frontendData = {
      historyCheckId: carWithHistory.historyCheckId,
      registrationNumber: carWithHistory.registrationNumber
    };
    
    console.log('   historyCheckId type:', typeof frontendData.historyCheckId);
    console.log('   historyCheckId exists:', !!frontendData.historyCheckId);
    
    if (frontendData.historyCheckId) {
      console.log('   ✅ Frontend should show vehicle history');
      console.log('   Previous Owners:', frontendData.historyCheckId.numberOfPreviousKeepers || frontendData.historyCheckId.previousOwners || 'Contact seller');
      console.log('   Keys:', frontendData.historyCheckId.numberOfKeys || frontendData.historyCheckId.keys || 'Contact seller');
    } else {
      console.log('   ❌ Frontend will show "not available" message');
    }

    console.log('\n✅ Car detail API test completed!');

  } catch (error) {
    console.error('❌ Error testing car detail API:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCarDetailAPI();