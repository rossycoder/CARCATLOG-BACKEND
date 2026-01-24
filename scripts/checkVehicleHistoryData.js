require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkHistoryData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const carId = '69738fa67bde58f466c26536';
    const car = await Car.findById(carId);

    if (!car) {
      console.log('Car not found');
      return;
    }

    console.log('\n=== VEHICLE HISTORY DATA ===');
    console.log('Registration:', car.registrationNumber);
    console.log('\nHistory Check ID:', car.historyCheckId);
    console.log('\nRaw History Data:');
    console.log(JSON.stringify(car.vehicleHistory, null, 2));
    
    console.log('\n=== CHECKING FOR CONTRADICTIONS ===');
    
    if (car.vehicleHistory) {
      const hasWriteOff = car.vehicleHistory.hasAccidentHistory || 
                          car.vehicleHistory.writeOffCategory || 
                          car.vehicleHistory.categoryD ||
                          car.vehicleHistory.categoryN ||
                          car.vehicleHistory.isWrittenOff;
      
      const neverWrittenOff = car.vehicleHistory.neverWrittenOff || 
                              !car.vehicleHistory.hasAccidentHistory;
      
      console.log('Has write-off indicator:', hasWriteOff);
      console.log('Never written off indicator:', neverWrittenOff);
      
      if (hasWriteOff && neverWrittenOff) {
        console.log('\n⚠️  CONTRADICTION DETECTED!');
        console.log('Vehicle shows BOTH write-off status AND never written off status');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkHistoryData();
