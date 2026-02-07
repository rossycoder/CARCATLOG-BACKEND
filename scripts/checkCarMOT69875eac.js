const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Direct schema definition to avoid service imports
const carSchema = new mongoose.Schema({}, { strict: false });
const vehicleHistorySchema = new mongoose.Schema({}, { strict: false });

const Car = mongoose.model('Car', carSchema);
const VehicleHistory = mongoose.model('VehicleHistory', vehicleHistorySchema);

async function checkCarMOT() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');

    const carId = '69875eac8405d9f14adee10f';
    
    // Car ko find karo
    const car = await Car.findById(carId);
    
    if (!car) {
      console.log('❌ Car nahi mili database mein');
      return;
    }

    console.log('\n=== CAR DETAILS ===');
    console.log('Registration:', car.registration);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Year:', car.year);
    console.log('Status:', car.status);
    
    console.log('\n=== MOT DATA IN CAR ===');
    console.log('MOT Status:', car.motStatus);
    console.log('MOT Expiry:', car.motExpiry);
    console.log('MOT Due Date:', car.motDueDate);
    console.log('Has MOT History:', car.motHistory ? 'Yes' : 'No');
    if (car.motHistory && car.motHistory.length > 0) {
      console.log('MOT History Count:', car.motHistory.length);
      console.log('Latest MOT:', JSON.stringify(car.motHistory[0], null, 2));
    }

    // Vehicle History check karo
    console.log('\n=== VEHICLE HISTORY CHECK ===');
    const history = await VehicleHistory.findOne({ registration: car.registration });
    
    if (!history) {
      console.log('❌ Vehicle History document nahi mila');
      console.log('Registration:', car.registration);
    } else {
      console.log('✅ Vehicle History mila');
      console.log('MOT Status:', history.motStatus);
      console.log('MOT Expiry:', history.motExpiry);
      console.log('Has MOT Tests:', history.motTests ? 'Yes' : 'No');
      if (history.motTests && history.motTests.length > 0) {
        console.log('MOT Tests Count:', history.motTests.length);
        console.log('Latest MOT Test:', JSON.stringify(history.motTests[0], null, 2));
      } else {
        console.log('⚠️ MOT Tests array khali hai');
      }
    }

    // Check karo ke car ka MOT actually hai ya nahi
    console.log('\n=== MOT EXISTENCE CHECK ===');
    if (!car.motExpiry && !car.motDueDate && (!car.motHistory || car.motHistory.length === 0)) {
      console.log('❌ Is car ka koi MOT data nahi hai');
      console.log('Possible reasons:');
      console.log('1. Car nai hai aur abhi MOT due nahi hua');
      console.log('2. MOT data fetch nahi hua tha');
      console.log('3. Car exempt hai MOT se');
    } else {
      console.log('✅ Car mein kuch MOT data hai');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkCarMOT();
