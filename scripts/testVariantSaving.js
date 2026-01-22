/**
 * Test script to check variant saving in database
 * Tests if variant is being trimmed and saved correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testVariantSaving() {
  try {
    console.log('🔍 Testing variant saving...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find a few cars with variants
    const carsWithVariants = await Car.find({ 
      variant: { $exists: true, $ne: null, $ne: '' }
    }).limit(5);
    
    console.log(`Found ${carsWithVariants.length} cars with variants:\n`);
    
    carsWithVariants.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Variant: "${car.variant}"`);
      console.log(`   Variant length: ${car.variant.length}`);
      console.log(`   Variant trimmed: "${car.variant.trim()}"`);
      console.log(`   Has leading/trailing spaces: ${car.variant !== car.variant.trim()}`);
      console.log('');
    });
    
    // Find cars with null or empty variants
    const carsWithoutVariants = await Car.find({
      $or: [
        { variant: null },
        { variant: '' },
        { variant: 'null' },
        { variant: 'undefined' }
      ]
    }).limit(5);
    
    console.log(`\nFound ${carsWithoutVariants.length} cars WITHOUT proper variants:\n`);
    
    carsWithoutVariants.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Variant: "${car.variant}"`);
      console.log(`   Engine Size: ${car.engineSize}L`);
      console.log(`   Fuel Type: ${car.fuelType}`);
      console.log(`   Transmission: ${car.transmission}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testVariantSaving();
