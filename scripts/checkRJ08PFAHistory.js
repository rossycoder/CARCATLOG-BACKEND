require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

async function checkRJ08PFAHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const vrm = 'RJ08PFA';
    
    // Check Car
    console.log('=== Checking Car ===');
    const car = await Car.findOne({ registrationNumber: vrm });
    if (car) {
      console.log('Car ID:', car._id);
      console.log('Registration:', car.registrationNumber);
      console.log('History Check Status:', car.historyCheckStatus);
      console.log('History Check ID:', car.historyCheckId);
      console.log('History Check Date:', car.historyCheckDate);
      
      // Check History
      if (car.historyCheckId) {
        console.log('\n=== Checking History ===');
        const history = await VehicleHistory.findById(car.historyCheckId);
        if (history) {
          console.log('History ID:', history._id);
          console.log('VRM:', history.vrm);
          console.log('numberOfPreviousKeepers:', history.numberOfPreviousKeepers);
          console.log('previousOwners:', history.previousOwners);
          console.log('numberOfOwners:', history.numberOfOwners);
          console.log('numberOfKeys:', history.numberOfKeys);
          console.log('serviceHistory:', history.serviceHistory);
          console.log('API Provider:', history.apiProvider);
          console.log('Check Date:', history.checkDate);
        } else {
          console.log('❌ History not found!');
        }
      } else {
        console.log('\n⚠️  No history check ID on car!');
      }
    } else {
      console.log('❌ Car not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

checkRJ08PFAHistory();
