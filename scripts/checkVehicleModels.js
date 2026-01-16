require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkVehicleModels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total cars
    const totalCars = await Car.countDocuments();
    console.log(`Total cars in database: ${totalCars}`);

    // Count cars with Unknown make
    const unknownMake = await Car.countDocuments({ make: 'Unknown' });
    console.log(`Cars with Unknown make: ${unknownMake}`);

    // Count cars with Unknown model
    const unknownModel = await Car.countDocuments({ model: 'Unknown' });
    console.log(`Cars with Unknown model: ${unknownModel}`);

    // Show sample cars with Unknown model
    console.log('\n📋 Sample cars with Unknown model:');
    const sampleCars = await Car.find({ model: 'Unknown' }).limit(5);
    sampleCars.forEach(car => {
      console.log(`  - ${car.registrationNumber}: ${car.make} ${car.model} (${car.year})`);
    });

    // Show sample cars with proper model
    console.log('\n✅ Sample cars with proper model:');
    const goodCars = await Car.find({ 
      model: { $ne: 'Unknown', $exists: true } 
    }).limit(5);
    goodCars.forEach(car => {
      console.log(`  - ${car.registrationNumber}: ${car.make} ${car.model} (${car.year})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

checkVehicleModels();
