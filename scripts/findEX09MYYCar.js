require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function findCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const registration = 'EX09MYY';
    
    // Find all cars with this registration
    const cars = await Car.find({ registration: registration });
    
    console.log(`Found ${cars.length} car(s) with registration ${registration}\n`);
    
    for (const car of cars) {
      console.log('=== CAR DETAILS ===');
      console.log('ID:', car._id);
      console.log('Registration:', car.registration);
      console.log('Make/Model:', car.make, car.model);
      console.log('Status:', car.status);
      console.log('Created:', car.createdAt);
      console.log('History Check ID:', car.historyCheckId);
      
      if (car.historyCheckId) {
        console.log('\n=== LINKED HISTORY RECORD ===');
        const history = await VehicleHistory.findById(car.historyCheckId);
        
        if (history) {
          console.log('✅ History record found');
          console.log('VRM:', history.vrm);
          console.log('Created:', history.createdAt);
          console.log('Has been written off?', history.writtenOff);
          
          if (history.writeOffDetails) {
            console.log('\n⚠️ WRITE-OFF DETAILS:');
            console.log(JSON.stringify(history.writeOffDetails, null, 2));
          }
        } else {
          console.log('❌ History record NOT found - invalid reference!');
        }
      } else {
        console.log('\n❌ No history check ID linked');
      }
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    // Also check all history records for this VRM
    console.log('=== ALL HISTORY RECORDS FOR', registration, '===');
    const allHistory = await VehicleHistory.find({ vrm: registration });
    console.log(`Found ${allHistory.length} history record(s)\n`);
    
    for (const history of allHistory) {
      console.log('History ID:', history._id);
      console.log('Created:', history.createdAt);
      console.log('Written off?', history.writtenOff);
      if (history.writeOffDetails) {
        console.log('Write-off details:', JSON.stringify(history.writeOffDetails, null, 2));
      }
      console.log('---');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findCar();
