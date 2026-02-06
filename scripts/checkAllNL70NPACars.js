/**
 * Check ALL cars with registration NL70NPA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const VehicleHistory = require('../models/VehicleHistory');

async function checkAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const vrm = 'NL70NPA';
    
    // Find ALL cars with this registration
    const cars = await Car.find({
      registrationNumber: { $regex: new RegExp(vrm, 'i') }
    }).sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${cars.length} car(s) with registration ${vrm}:\n`);
    
    if (cars.length === 0) {
      console.log('❌ No cars found!');
      console.log('   Client needs to add the car again');
    } else {
      cars.forEach((car, index) => {
        console.log(`${index + 1}. Car ID: ${car._id}`);
        console.log(`   Registration: ${car.registrationNumber}`);
        console.log(`   Make/Model: ${car.make} ${car.model}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Created: ${car.createdAt}`);
        console.log(`   historyCheckId: ${car.historyCheckId || 'NOT SET'}`);
        console.log(`   MOT Due: ${car.motDue || 'NOT SET'}`);
        console.log(`   Running Costs: ${car.fuelEconomyCombined ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

    // Check VehicleHistory
    console.log(`\n🔍 Checking VehicleHistory for ${vrm}...`);
    const histories = await VehicleHistory.find({
      vrm: vrm.toUpperCase().replace(/\s/g, '')
    }).sort({ checkDate: -1 });
    
    console.log(`\n📊 Found ${histories.length} VehicleHistory record(s):\n`);
    
    if (histories.length === 0) {
      console.log('❌ No VehicleHistory found!');
      console.log('   Fresh API call will be made when car is added');
    } else {
      histories.forEach((history, index) => {
        console.log(`${index + 1}. History ID: ${history._id}`);
        console.log(`   VRM: ${history.vrm}`);
        console.log(`   Check Date: ${history.checkDate}`);
        console.log(`   Status: ${history.checkStatus}`);
        console.log(`   Make/Model: ${history.make} ${history.model}`);
        console.log(`   Has Running Costs: ${!!(history.combinedMpg || history.co2Emissions)}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

checkAllCars();
