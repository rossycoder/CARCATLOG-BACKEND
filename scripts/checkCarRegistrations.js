const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');

async function checkCarRegistrations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all cars
    const allCars = await Car.find({}).sort({ createdAt: -1 }).limit(10);

    console.log(`Found ${allCars.length} most recent cars:\n`);

    allCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model} (${car.year})`);
      console.log(`   ID: ${car._id}`);
      console.log(`   Registration: ${car.registrationNumber || 'NOT SET'}`);
      console.log(`   Advert ID: ${car.advertId || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Data Source: ${car.dataSource}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

checkCarRegistrations();
