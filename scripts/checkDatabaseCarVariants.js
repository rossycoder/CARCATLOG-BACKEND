/**
 * Check what variant data is stored in database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkDatabaseVariants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first 10 cars
    const cars = await Car.find().limit(10);

    console.log('\n📊 Database Cars - Variant Field Check:');
    console.log('='.repeat(80));

    cars.forEach((car, index) => {
      console.log(`\n[${index + 1}] ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Variant: ${car.variant || 'NOT SET'}`);
      console.log(`   Submodel: ${car.submodel || 'NOT SET'}`);
      console.log(`   Engine Size: ${car.engineSize || 'NOT SET'}`);
      console.log(`   Fuel Type: ${car.fuelType || 'NOT SET'}`);
      console.log(`   Transmission: ${car.transmission || 'NOT SET'}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabaseVariants();
