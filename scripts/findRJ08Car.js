/**
 * Find RJ08 car in database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Search for cars with RJ08 in registration
    const cars = await Car.find({
      registrationNumber: { $regex: /RJ08/i }
    }).limit(5);
    
    console.log(`\nFound ${cars.length} cars with RJ08 in registration:`);
    
    cars.forEach(car => {
      console.log('\n---');
      console.log('ID:', car._id);
      console.log('Registration:', car.registrationNumber);
      console.log('Make:', car.make);
      console.log('Model:', car.model);
      console.log('Variant:', car.variant);
      console.log('Display Title:', car.displayTitle);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

findCar();
