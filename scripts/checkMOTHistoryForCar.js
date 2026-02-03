const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkMOTHistoryForCar() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB');
    
    const car = await Car.findOne({ registrationNumber: 'EX09MYY' }).populate('historyCheckId');
    
    if (car) {
      console.log('\n📊 Car MOT Data:');
      console.log('==================');
      console.log('ID:', car._id);
      console.log('Make/Model:', car.make, car.model);
      console.log('Registration:', car.registrationNumber);
      
      console.log('\n🔍 MOT Fields in Car Document:');
      console.log('motHistory:', car.motHistory);
      console.log('motStatus:', car.motStatus);
      console.log('motExpiry:', car.motExpiry);
      console.log('motDue:', car.motDue);
      
      if (car.historyCheckId) {
        console.log('\n🔍 MOT Fields in History Check Document:');
        console.log('historyCheckId.motHistory:', car.historyCheckId.motHistory);
        console.log('historyCheckId.motStatus:', car.historyCheckId.motStatus);
        console.log('historyCheckId.motExpiryDate:', car.historyCheckId.motExpiryDate);
        
        if (car.historyCheckId.motHistory && car.historyCheckId.motHistory.length > 0) {
          console.log('\n📋 MOT History Tests:');
          car.historyCheckId.motHistory.forEach((test, index) => {
            console.log(`Test ${index + 1}:`, {
              testDate: test.testDate,
              result: test.result,
              mileage: test.odometerValue || test.mileage,
              expiryDate: test.expiryDate
            });
          });
        } else {
          console.log('❌ No MOT history tests found in history check document');
        }
      } else {
        console.log('❌ No history check document found');
      }
      
      // Check if we need to fetch MOT history
      if ((!car.motHistory || car.motHistory.length === 0) && 
          (!car.historyCheckId?.motHistory || car.historyCheckId.motHistory.length === 0)) {
        console.log('\n🚨 MOT History Missing - Need to fetch from API');
        console.log('Recommendation: Run MOT history fetch script for this vehicle');
      } else {
        console.log('\n✅ MOT History Available');
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

checkMOTHistoryForCar();