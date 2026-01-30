require('dotenv').config();
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');
const Car = require('../models/Car');

async function checkNU10YEVHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const vrm = 'NU10YEV';
    
    // Check VehicleHistory collection
    console.log('\n=== Checking VehicleHistory Collection ===');
    const historyRecords = await VehicleHistory.find({ vrm }).sort({ checkDate: -1 });
    console.log(`Found ${historyRecords.length} history records for ${vrm}`);
    
    if (historyRecords.length > 0) {
      const latestHistory = historyRecords[0];
      console.log('\nLatest History Record:');
      console.log('- Check Date:', latestHistory.checkDate);
      console.log('- Number of Previous Keepers:', latestHistory.numberOfPreviousKeepers);
      console.log('- Previous Owners:', latestHistory.previousOwners);
      console.log('- Number of Owners:', latestHistory.numberOfOwners);
      console.log('- Number of Keys:', latestHistory.numberOfKeys);
      console.log('- Service History:', latestHistory.serviceHistory);
      console.log('- Is Stolen:', latestHistory.isStolen);
      console.log('- Is Written Off:', latestHistory.isWrittenOff);
      console.log('- Has Accident History:', latestHistory.hasAccidentHistory);
      console.log('- Check Status:', latestHistory.checkStatus);
      console.log('- API Provider:', latestHistory.apiProvider);
      console.log('\nFull Record:');
      console.log(JSON.stringify(latestHistory, null, 2));
    }
    
    // Check Car collection
    console.log('\n=== Checking Car Collection ===');
    const cars = await Car.find({ registrationNumber: vrm });
    console.log(`Found ${cars.length} cars with registration ${vrm}`);
    
    if (cars.length > 0) {
      const car = cars[0];
      console.log('\nCar Details:');
      console.log('- ID:', car._id);
      console.log('- Make:', car.make);
      console.log('- Model:', car.model);
      console.log('- Year:', car.year);
      console.log('- History Check Status:', car.historyCheckStatus);
      console.log('- History Check Date:', car.historyCheckDate);
      console.log('- History Check ID:', car.historyCheckId);
      
      if (car.historyCheckId) {
        const linkedHistory = await VehicleHistory.findById(car.historyCheckId);
        if (linkedHistory) {
          console.log('\nLinked History Record:');
          console.log('- Number of Previous Keepers:', linkedHistory.numberOfPreviousKeepers);
          console.log('- Previous Owners:', linkedHistory.previousOwners);
          console.log('- Number of Owners:', linkedHistory.numberOfOwners);
        } else {
          console.log('\nWARNING: History Check ID exists but record not found!');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkNU10YEVHistory();
