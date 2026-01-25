require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkNewCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    // Get the car ID from the URL you showed: 69761db5425af921b7da4d94
    const carId = '69761db5425af921b7da4d94';
    
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car not found with ID:', carId);
      await mongoose.connection.close();
      return;
    }

    console.log('=== CAR DETAILS ===');
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
        console.log('Has been stolen?', history.stolen);
        console.log('Has been scrapped?', history.scrapped);
        console.log('Has been imported?', history.imported);
        console.log('Has been exported?', history.exported);
        console.log('Has been written off?', history.writtenOff);
        
        if (history.writeOffDetails) {
          console.log('\n⚠️ WRITE-OFF DETAILS:');
          console.log(JSON.stringify(history.writeOffDetails, null, 2));
        }
      } else {
        console.log('❌ History record NOT found - invalid reference!');
      }
    } else {
      console.log('\n❌ No history check ID linked to this car');
      
      // Check if history exists for this registration
      const history = await VehicleHistory.findOne({ vrm: car.registration });
      if (history) {
        console.log('\n⚠️ But history record EXISTS for this registration:');
        console.log('History ID:', history._id);
        console.log('Written off?', history.writtenOff);
        if (history.writeOffDetails) {
          console.log('Write-off details:', JSON.stringify(history.writeOffDetails, null, 2));
        }
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNewCar();
