const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');

async function fixEngineSize() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the car with registration EX09MYY
    const car = await Car.findOne({ registrationNumber: 'EX09MYY' });
    
    if (!car) {
      console.log('❌ Car with registration EX09MYY not found');
      return;
    }

    console.log('\n📋 Current car data:');
    console.log(`Make: ${car.make}`);
    console.log(`Model: ${car.model}`);
    console.log(`Engine Size: ${car.engineSize}`);
    console.log(`Display Title: ${car.displayTitle}`);

    // Update engine size to 1.3L (1339cc / 1000)
    car.engineSize = 1.3;
    
    // Save the car (this will trigger the pre-save hook to regenerate displayTitle)
    await car.save();

    console.log('\n✅ Updated car data:');
    console.log(`Engine Size: ${car.engineSize}L`);
    console.log(`Display Title: ${car.displayTitle}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixEngineSize();
