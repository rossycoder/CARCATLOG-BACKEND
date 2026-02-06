require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function testAPIResponse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const carId = '69864e4fa41026f9288bb27c';
    
    console.log('\n🔍 Simulating API response (getCarById)...\n');
    
    // This simulates what the API returns
    const car = await Car.findById(carId).populate('historyCheckId').lean();
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    // Simulate the API response structure
    const apiResponse = {
      success: true,
      data: car
    };

    console.log('📦 API RESPONSE DATA:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(apiResponse.data, null, 2));
    
    console.log('\n\n🔍 FRONTEND WILL RECEIVE:');
    console.log('='.repeat(80));
    console.log('car.motDue:', apiResponse.data.motDue);
    console.log('car.motExpiry:', apiResponse.data.motExpiry);
    console.log('car.motHistory:', apiResponse.data.motHistory ? `Array with ${apiResponse.data.motHistory.length} records` : 'undefined');
    
    if (apiResponse.data.motHistory && apiResponse.data.motHistory.length > 0) {
      console.log('car.motHistory[0].expiryDate:', apiResponse.data.motHistory[0].expiryDate);
    }
    
    console.log('\n🎯 FRONTEND LOGIC CHECK:');
    console.log('='.repeat(80));
    
    const data = apiResponse.data;
    
    // This is the exact logic from CarDetailPage.jsx lines 443-457
    let motDisplay;
    
    if (data.motDue || data.motExpiry) {
      const dateToUse = data.motDue || data.motExpiry;
      motDisplay = new Date(dateToUse).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      console.log('✅ Will show MOT date:', motDisplay);
    } else if (data.motHistory && data.motHistory.length > 0 && data.motHistory[0].expiryDate) {
      const dateToUse = data.motHistory[0].expiryDate;
      motDisplay = new Date(dateToUse).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      console.log('✅ Will show MOT date (from history):', motDisplay);
    } else {
      motDisplay = 'Contact seller for MOT details';
      console.log('❌ Will show:', motDisplay);
    }
    
    console.log('\n📅 EXPECTED FRONTEND DISPLAY:');
    console.log('MOT Due:', motDisplay);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAPIResponse();
