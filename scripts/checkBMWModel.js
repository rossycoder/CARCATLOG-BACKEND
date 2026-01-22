const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkBMW() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const car = await Car.findOne({ registrationNumber: 'AV13NFC' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('=== BMW 335I M SPORT AUTO ===\n');
    console.log('Make:', car.make);
    console.log('Model:', car.model);
    console.log('Submodel:', car.submodel);
    console.log('Engine Size:', car.engineSize);
    console.log('Fuel Type:', car.fuelType);
    console.log('Transmission:', car.transmission);
    console.log('\n=== Full Vehicle Data ===');
    console.log(JSON.stringify({
      make: car.make,
      model: car.model,
      submodel: car.submodel,
      engineSize: car.engineSize,
      fuelType: car.fuelType,
      transmission: car.transmission,
      year: car.year
    }, null, 2));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBMW();
