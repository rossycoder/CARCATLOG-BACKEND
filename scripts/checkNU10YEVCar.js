/**
 * Check if NU10YEV car exists in database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkCar() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'NU10YEV';
    
    // Find car
    console.log(`Looking for car with registration ${vrm}...`);
    const car = await Car.findOne({ registrationNumber: vrm }).lean();
    
    if (car) {
      console.log('✅ Car found in database');
      console.log('  ID:', car._id);
      console.log('  Make:', car.make);
      console.log('  Model:', car.model);
      console.log('  Year:', car.year);
      console.log('  Advert Status:', car.advertStatus);
      console.log('  Advert ID:', car.advertId);
    } else {
      console.log('❌ Car not found in database');
    }
    
    // Check vehicle history
    console.log(`\nLooking for vehicle history for ${vrm}...`);
    const history = await VehicleHistory.findOne({ vrm: vrm }).lean();
    
    if (history) {
      console.log('✅ Vehicle history found in database');
      console.log('  Check Date:', history.checkDate);
      console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
      console.log('  V5C Certificate Count:', history.v5cCertificateCount);
      console.log('  V5C Certificate List:', history.v5cCertificateList);
      console.log('  Keeper Changes List Length:', history.keeperChangesList?.length || 0);
      console.log('  Plate Changes:', history.plateChanges);
      console.log('  Colour Changes:', history.colourChanges);
      console.log('  Is Stolen:', history.isStolen);
      console.log('  Has Finance:', history.hasOutstandingFinance);
      console.log('  Is Written Off:', history.isWrittenOff);
    } else {
      console.log('❌ Vehicle history not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkCar();
