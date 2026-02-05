require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function resaveBMWCar() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const carId = '6983ca26c10d3f3d9b026626';
    console.log(`🔍 Finding BMW car: ${carId}`);
    
    const car = await Car.findById(carId);

    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📊 Before Re-save:');
    console.log('=====================================');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Engine Size:', car.engineSize);
    console.log('Display Title:', car.displayTitle);

    // Force variant to be empty so pre-save hook fetches it again
    console.log('\n🔄 Clearing variant to trigger auto-fetch...');
    car.variant = null;

    console.log('💾 Re-saving car (pre-save hook will regenerate displayTitle)...\n');
    await car.save();

    console.log('\n✅ After Re-save:');
    console.log('=====================================');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Engine Size:', car.engineSize);
    console.log('Body Type:', car.bodyType);
    console.log('Doors:', car.doors);
    console.log('Emission Class:', car.emissionClass);
    console.log('Display Title:', car.displayTitle);

    console.log('\n🎯 New Title:');
    console.log(`   "${car.displayTitle}"`);

    await mongoose.connection.close();
    console.log('\n✅ Re-save completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resaveBMWCar();
