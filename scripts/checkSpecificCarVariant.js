/**
 * Check specific car variant data
 * Usage: node backend/scripts/checkSpecificCarVariant.js RJ08PFA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkCarVariant(registration) {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find car by registration
    const car = await Car.findOne({ 
      registrationNumber: new RegExp(`^${registration}$`, 'i') 
    });

    if (!car) {
      console.log(`❌ Car not found with registration: ${registration}`);
      return;
    }

    console.log('🚗 Car Found!');
    console.log('─'.repeat(70));
    console.log(`ID: ${car._id}`);
    console.log(`Make: ${car.make}`);
    console.log(`Model: ${car.model}`);
    console.log(`Registration: ${car.registrationNumber}`);
    console.log(`Year: ${car.year}`);
    console.log('─'.repeat(70));
    
    console.log('\n📋 Variant Information:');
    console.log('─'.repeat(70));
    console.log(`variant: "${car.variant}"`);
    console.log(`variant type: ${typeof car.variant}`);
    console.log(`variant is null: ${car.variant === null}`);
    console.log(`variant is undefined: ${car.variant === undefined}`);
    console.log(`variant is "null" string: ${car.variant === 'null'}`);
    console.log(`variant is empty: ${car.variant === ''}`);
    console.log('─'.repeat(70));

    console.log('\n📋 Related Fields:');
    console.log('─'.repeat(70));
    console.log(`submodel: "${car.submodel}"`);
    console.log(`modelVariant: "${car.modelVariant}"`);
    console.log(`displayTitle: "${car.displayTitle}"`);
    console.log(`engineSize: ${car.engineSize}`);
    console.log(`fuelType: ${car.fuelType}`);
    console.log(`transmission: ${car.transmission}`);
    console.log(`doors: ${car.doors}`);
    console.log('─'.repeat(70));

    console.log('\n🔧 What Frontend Will Show:');
    console.log('─'.repeat(70));
    
    // Simulate frontend logic
    const parts = [];
    
    if (car.engineSize) {
      const size = parseFloat(car.engineSize);
      if (!isNaN(size)) {
        parts.push(size.toFixed(1));
      }
    }
    
    if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
      parts.push(car.variant);
    } else if (car.submodel && car.submodel !== 'null' && car.submodel !== 'undefined' && car.submodel.trim() !== '') {
      parts.push(car.submodel);
    } else {
      if (car.fuelType && car.fuelType !== 'Petrol') {
        parts.push(car.fuelType);
      }
    }
    
    if (car.doors) {
      parts.push(`${car.doors}dr`);
    }
    
    const displayVariant = parts.join(' ');
    console.log(`Display Variant: "${displayVariant}"`);
    console.log('─'.repeat(70));

    console.log('\n💡 Recommendation:');
    if (!car.variant || car.variant === 'null' || car.variant === 'undefined' || car.variant === '') {
      console.log('❌ Variant is missing or invalid!');
      console.log('✅ Need to fetch from API and update');
      console.log('\nRun this command to fix:');
      console.log(`node backend/scripts/fixMissingVariants.js ${registration}`);
    } else {
      console.log('✅ Variant exists and looks good!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Get registration from command line argument
const registration = process.argv[2];

if (!registration) {
  console.log('Usage: node backend/scripts/checkSpecificCarVariant.js <REGISTRATION>');
  console.log('Example: node backend/scripts/checkSpecificCarVariant.js RJ08PFA');
  process.exit(1);
}

checkCarVariant(registration);
