/**
 * Check for cars with "null" string variant values in database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkNullVariants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find cars with variant as string "null"
    const carsWithNullString = await Car.find({ 
      variant: 'null' 
    }).select('make model variant engineSize fuelType transmission registrationNumber').limit(10);

    console.log(`Found ${carsWithNullString.length} cars with variant="null" (string):\n`);
    carsWithNullString.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber}`);
      console.log(`   Variant: "${car.variant}" (type: ${typeof car.variant})`);
      console.log(`   Engine: ${car.engineSize}L, Fuel: ${car.fuelType}, Trans: ${car.transmission}`);
      console.log('');
    });

    // Count total cars with "null" string variant
    const totalNullString = await Car.countDocuments({ variant: 'null' });
    console.log(`Total cars with variant="null" string: ${totalNullString}`);

    // Count cars with actual null variant
    const totalActualNull = await Car.countDocuments({ variant: null });
    console.log(`Total cars with variant=null (actual null): ${totalActualNull}`);

    // Count cars with undefined variant
    const totalUndefined = await Car.countDocuments({ variant: { $exists: false } });
    console.log(`Total cars with variant field missing: ${totalUndefined}`);

    // Count cars with valid variant
    const totalValid = await Car.countDocuments({ 
      variant: { $ne: null, $ne: 'null', $ne: '', $exists: true } 
    });
    console.log(`Total cars with valid variant: ${totalValid}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNullVariants();
