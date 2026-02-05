const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function listAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const cars = await Car.find({}).select('registrationNumber make model year advertStatus').limit(10);
    
    console.log(`📋 Total cars: ${await Car.countDocuments()}\n`);
    
    if (cars.length === 0) {
      console.log('No cars found');
    } else {
      console.log('Recent cars:');
      cars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.registrationNumber || 'NO REG'} - ${car.make} ${car.model} (${car.year}) - ${car.advertStatus}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

listAllCars();
