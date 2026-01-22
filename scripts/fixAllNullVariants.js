/**
 * Fix all cars with null variants in database
 * Generate and save variants for existing cars
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const vehicleFormatter = require('../utils/vehicleFormatter');

async function fixAllNullVariants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all cars with null variant
    const carsWithNullVariant = await Car.find({ 
      $or: [
        { variant: null },
        { variant: 'null' },
        { variant: 'undefined' },
        { variant: '' }
      ]
    });

    console.log(`Found ${carsWithNullVariant.length} cars with null/empty variant\n`);

    if (carsWithNullVariant.length === 0) {
      console.log('No cars to fix!');
      await mongoose.connection.close();
      return;
    }

    let fixed = 0;
    let skipped = 0;

    for (const car of carsWithNullVariant) {
      console.log(`\nProcessing: ${car.make} ${car.model} (${car.registrationNumber || 'No reg'})`);
      console.log(`  Current variant: ${car.variant}`);
      
      // Prepare data for variant generation
      const variantData = {
        make: car.make,
        model: car.model,
        engineSize: car.engineSize,
        engineSizeLitres: car.engineSize,
        fuelType: car.fuelType,
        transmission: car.transmission,
        doors: car.doors,
        modelVariant: car.modelVariant
      };
      
      // Generate variant
      const generatedVariant = vehicleFormatter.formatVariant(variantData);
      
      if (generatedVariant) {
        car.variant = generatedVariant;
        await car.save();
        console.log(`  ✅ Fixed! New variant: "${generatedVariant}"`);
        fixed++;
      } else {
        console.log(`  ⚠️  Could not generate variant (missing data)`);
        skipped++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Fixed ${fixed} cars`);
    console.log(`⚠️  Skipped ${skipped} cars (insufficient data)`);
    console.log(`${'='.repeat(50)}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllNullVariants();
