/**
 * Fix BMW I4 M50 - Swap model and variant fields
 * Current: model="I4 M50", variant="i4"
 * Should be: model="i4", variant="M50"
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('../models/Car');

async function fixBMWI4Model() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the BMW I4 M50 car
    const car = await Car.findOne({
      make: 'BMW',
      model: 'I4 M50',
      variant: 'i4'
    });

    if (!car) {
      console.log('❌ BMW I4 M50 car not found');
      process.exit(0);
    }

    console.log('🔍 Found car:', {
      _id: car._id,
      make: car.make,
      model: car.model,
      variant: car.variant,
      registrationNumber: car.registrationNumber
    });

    // Swap model and variant
    car.model = 'i4';
    car.variant = 'M50';

    await car.save();

    console.log('✅ Fixed BMW I4 M50 car:');
    console.log('   Model: "i4"');
    console.log('   Variant: "M50"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBMWI4Model();
