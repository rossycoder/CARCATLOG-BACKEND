const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkNewCarMOTFetch() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const carId = '6982517dd49cfacb5f246ff8';
    
    console.log('\n🔍 CHECKING NEW CAR MOT FETCH ISSUE');
    console.log('====================================');
    
    // Find the new car
    const car = await Car.findById(carId);
    
    if (car) {
      console.log('🚗 Car Found:');
      console.log('   ID:', car._id);
      console.log('   Make/Model:', car.make, car.model);
      console.log('   Registration:', car.registrationNumber);
      console.log('   Created:', car.createdAt);
      console.log('   MOT History Count:', car.motHistory ? car.motHistory.length : 0);
      console.log('   MOT Status:', car.motStatus);
      
      console.log('\n🔍 ISSUE ANALYSIS:');
      console.log('==================');
      
      if (!car.motHistory || car.motHistory.length === 0) {
        console.log('❌ MOT History is empty');
        console.log('');
        console.log('🔍 Possible reasons:');
        console.log('1. API credentials missing (CHECKCARD_API_KEY)');
        console.log('2. MOT History service failed during car creation');
        console.log('3. Pre-save hook didn\'t execute properly');
        console.log('4. API returned no data for this VRM');
        
        console.log('\n💡 SOLUTION:');
        console.log('============');
        console.log('We can manually fetch MOT history for this car using our script');
        
        // Check if we can fetch MOT history now
        console.log('\n🔧 MANUAL MOT FETCH ATTEMPT:');
        console.log('-----------------------------');
        
        try {
          // Try to fetch MOT history manually
          const checkCarClient = require('../clients/CheckCarDetailsClient');
          console.log('🔍 Attempting to fetch MOT history...');
          
          // This will likely fail due to missing API key, but let's see
          const motData = await checkCarClient.getMOTHistory(car.registrationNumber);
          
          if (motData && motData.motTests && motData.motTests.length > 0) {
            console.log('✅ MOT data available:', motData.motTests.length, 'tests');
            
            // Update the car with MOT data
            car.motHistory = motData.motTests;
            car.motStatus = motData.motTestStatus || 'Unknown';
            car.motExpiry = motData.motExpiryDate;
            car.motDue = motData.motExpiryDate;
            
            await car.save();
            console.log('✅ Car updated with MOT history');
          } else {
            console.log('❌ No MOT data returned from API');
          }
          
        } catch (apiError) {
          console.log('❌ API Error:', apiError.message);
          
          if (apiError.message.includes('API key')) {
            console.log('\n🔑 API KEY ISSUE CONFIRMED');
            console.log('==========================');
            console.log('The automatic MOT fetch failed because API credentials are missing.');
            console.log('');
            console.log('📋 TO FIX THIS:');
            console.log('1. Add CHECKCARD_API_KEY to .env file');
            console.log('2. Or use our sample data script for testing');
            console.log('');
            console.log('🚀 QUICK FIX - Add sample MOT data:');
            console.log(`node addSampleMOTDataForCar.js ${car.registrationNumber}`);
          }
        }
      } else {
        console.log('✅ MOT History exists:', car.motHistory.length, 'tests');
      }
      
    } else {
      console.log('❌ Car not found');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNewCarMOTFetch();