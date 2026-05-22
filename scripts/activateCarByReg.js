require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const reg = process.argv[2] || 'MA57LDL';

    const car = await Car.findOne({ registrationNumber: reg.toUpperCase() });

    if (!car) {
      console.log(`❌ Car not found: ${reg}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`Found: ${car.make} ${car.model} - Status: ${car.advertStatus}`);

    car.advertStatus = 'active';
    car.publishedAt = car.publishedAt || new Date();
    await car.save({ validateBeforeSave: false });

    console.log(`✅ Car activated! Status is now: active`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateCar();
