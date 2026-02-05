require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkSpecificCar() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the car from the screenshot
    const carId = '6983ca26c10d3f3d9b026626';
    console.log(`🔍 Finding car with ID: ${carId}`);
    
    const car = await Car.findById(carId);

    if (!car) {
      console.log('❌ Car not found');
      process.exit(1);
    }

    console.log('\n📊 Car Data:');
    console.log('=====================================');
    console.log('ID:', car._id);
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Variant:', car.variant);
    console.log('Engine Size:', car.engineSize);
    console.log('Body Type:', car.bodyType);
    console.log('Transmission:', car.transmission);
    console.log('Fuel Type:', car.fuelType);
    console.log('Emission Class:', car.emissionClass);
    console.log('Doors:', car.doors);
    console.log('Registration:', car.registrationNumber);
    console.log('Year:', car.year);
    console.log('Display Title:', car.displayTitle);

    console.log('\n🔍 Issue Analysis:');
    console.log('=====================================');
    if (car.model === 'Unknown' || !car.model) {
      console.log('❌ Model is "Unknown" or missing');
    }
    if (car.variant === 'Unknown' || !car.variant || car.variant === 'null') {
      console.log('❌ Variant is "Unknown" or missing');
    }
    if (!car.engineSize) {
      console.log('❌ Engine size is missing');
    }

    console.log('\n💡 Solution:');
    console.log('=====================================');
    if (car.registrationNumber) {
      console.log('✅ Registration number exists:', car.registrationNumber);
      console.log('📝 We can fetch real data from API using this registration');
    } else {
      console.log('❌ No registration number - cannot fetch from API');
    }

    await mongoose.connection.close();
    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSpecificCar();
