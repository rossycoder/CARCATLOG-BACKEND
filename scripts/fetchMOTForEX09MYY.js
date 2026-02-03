const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');
const checkCarClient = require('../clients/CheckCarDetailsClient');

async function fetchMOTForEX09MYY() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const vrm = 'EX09MYY';
    
    // Find the car
    const car = await Car.findOne({ registrationNumber: vrm });
    
    if (!car) {
      console.log('❌ Car not found with registration:', vrm);
      process.exit(1);
    }
    
    console.log('🚗 Car:', car.advertId);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Current MOT History Count:', car.motHistory ? car.motHistory.length : 0);
    
    console.log('\n🔍 Fetching MOT history from API...');
    
    const motData = await checkCarClient.getMOTHistory(vrm);
    
    if (motData && motData.motTests && motData.motTests.length > 0) {
      console.log('✅ MOT data fetched from API');
      console.log('   Found', motData.motTests.length, 'MOT records');
      
      // Save to car document
      console.log('💾 Saving MOT history to car document...');
      car.motHistory = motData.motTests;
      car.motStatus = motData.motTestStatus || 'Unknown';
      car.motExpiry = motData.motExpiryDate;
      car.motDue = motData.motExpiryDate;
      await car.save();
      console.log('✅ MOT history saved to car document');
      
      // Update vehicle history document if it exists
      if (car.historyCheckId) {
        console.log('💾 Updating vehicle history document with MOT data...');
        const vehicleHistory = await VehicleHistory.findById(car.historyCheckId);
        if (vehicleHistory) {
          vehicleHistory.motHistory = motData.motTests;
          vehicleHistory.motStatus = motData.motTestStatus;
          vehicleHistory.motExpiryDate = motData.motExpiryDate;
          await vehicleHistory.save();
          console.log('✅ MOT history saved to vehicle history document');
        }
      }
      
      console.log('\n🎉 SUCCESS! MOT history now saved to database');
      console.log('   Latest MOT:', motData.motTests[0]?.testDate);
      console.log('   MOT Status:', motData.motTestStatus);
      console.log('   MOT Expiry:', motData.motExpiryDate);
      
    } else {
      console.log('❌ No MOT data found for this vehicle');
      console.log('Response:', motData);
    }
    
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fetchMOTForEX09MYY();