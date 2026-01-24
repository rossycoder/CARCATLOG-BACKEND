const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');

async function checkEngineSizes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all cars with engine size 0 or null
    const carsWithZeroEngine = await Car.find({
      $or: [
        { engineSize: 0 },
        { engineSize: null },
        { engineSize: { $exists: false } }
      ]
    }).limit(10);

    console.log(`\n📊 Found ${carsWithZeroEngine.length} cars with zero/null engine size:\n`);

    for (const car of carsWithZeroEngine) {
      console.log(`Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`Make/Model: ${car.make} ${car.model}`);
      console.log(`Engine Size: ${car.engineSize}`);
      console.log(`Display Title: ${car.displayTitle}`);
      console.log(`Status: ${car.advertStatus}`);
      console.log('---');
    }

    // Also check total cars
    const totalCars = await Car.countDocuments();
    console.log(`\n📈 Total cars in database: ${totalCars}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkEngineSizes();
