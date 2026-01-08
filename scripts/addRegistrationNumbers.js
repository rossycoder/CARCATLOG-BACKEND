const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');

// Sample UK registration numbers
const sampleRegistrations = [
  'BD51SMR', 'GF12ABC', 'LK63XYZ', 'MN14DEF', 'PQ65GHI',
  'RS16JKL', 'TU67MNO', 'VW18PQR', 'XY19STU', 'AB20VWX',
  'CD21YZA', 'EF22BCD', 'GH23EFG', 'IJ24HIJ', 'KL25KLM'
];

async function addRegistrationNumbers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find all cars without registration numbers
    const carsWithoutReg = await Car.find({
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { registrationNumber: '' }
      ]
    });

    console.log(`\nFound ${carsWithoutReg.length} cars without registration numbers`);

    if (carsWithoutReg.length === 0) {
      console.log('All cars already have registration numbers!');
      process.exit(0);
    }

    let updated = 0;
    for (let i = 0; i < carsWithoutReg.length; i++) {
      const car = carsWithoutReg[i];
      const regNumber = sampleRegistrations[i % sampleRegistrations.length];
      
      car.registrationNumber = regNumber;
      car.dataSource = 'manual'; // Mark as manually entered
      await car.save();
      
      updated++;
      console.log(`✓ Updated ${car.make} ${car.model} (${car._id}) with registration: ${regNumber}`);
    }

    console.log(`\n✓ Successfully updated ${updated} cars with registration numbers`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

addRegistrationNumbers();
