require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findRealRegistration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const car = await Car.findOne({
      registrationNumber: { $exists: true, $ne: null }
    });
    
    if (car) {
      console.log('Found car registration:', car.registrationNumber);
      console.log('Make/Model:', car.make, car.model);
      console.log('Year:', car.year);
    } else {
      console.log('No cars with registration found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

findRealRegistration();