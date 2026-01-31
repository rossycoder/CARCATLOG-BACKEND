require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarDistance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const car = await Car.findOne({ make: 'SKODA', model: 'Octavia' });

    if (!car) {
      console.log('❌ Car not found');
      return;
    }

    console.log('📍 Car Details:');
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Location:', car.locationName);
    console.log('   Coordinates:', car.latitude, ',', car.longitude);
    console.log('   Distance field in DB:', car.distance);
    console.log('\n⚠️  Problem: Distance field should NOT be stored in database!');
    console.log('   Distance should be calculated at runtime based on user location.');
    
    if (car.distance !== undefined) {
      console.log('\n🔧 Removing distance field from database...');
      car.distance = undefined;
      await car.save();
      console.log('✅ Distance field removed!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCarDistance();
