/**
 * Find LS70UAK Car in Database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const car = await Car.findOne({ registrationNumber: 'LS70UAK' });
    
    if (car) {
      console.log('✅ Car found!');
      console.log(`   ID: ${car._id}`);
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Status: ${car.status}`);
      console.log(`   Created: ${car.createdAt}`);
    } else {
      console.log('❌ Car not found in database');
      console.log('\nSearching for any Audi Q2...');
      
      const audiCars = await Car.find({ make: /audi/i, model: /q2/i }).limit(5);
      console.log(`\nFound ${audiCars.length} Audi Q2 cars:`);
      audiCars.forEach(c => {
        console.log(`   ${c._id} - ${c.registrationNumber} - ${c.make} ${c.model}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

findCar();
