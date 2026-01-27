/**
 * Fix Missing Variants Script
 * Finds cars with missing variants and fetches them from CheckCarDetails API
 */

const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');
require('dotenv').config();

async function fixMissingVariants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find cars with missing or invalid variants
    const carsWithMissingVariants = await Car.find({
      $or: [
        { variant: { $exists: false } },
        { variant: null },
        { variant: '' },
        { variant: 'null' },
        { variant: 'undefined' }
      ],
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    }).limit(50);

    console.log(`\n📊 Found ${carsWithMissingVariants.length} cars with missing variants\n`);

    if (carsWithMissingVariants.length === 0) {
      console.log('✅ All cars have variants!');
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const car of carsWithMissingVariants) {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`🚗 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Current variant: "${car.variant}"`);
      console.log(`   Engine: ${car.engineSize}L ${car.fuelType}`);

      try {
        // Fetch data from CheckCarDetails API
        console.log(`   📡 Fetching from CheckCarDetails API...`);
        const apiData = await CheckCarDetailsClient.getVehicleData(car.registrationNumber);

        // Extract modelVariant from API
        const apiVariant = apiData.modelVariant || apiData.variant;

        if (!apiVariant || apiVariant === 'null' || apiVariant === 'undefined' || apiVariant.trim() === '') {
          console.log(`   ⚠️  No valid variant in API data - skipping`);
          skipped++;
          continue;
        }

        console.log(`   📝 API variant: "${apiVariant}"`);

        // Update variant
        car.variant = apiVariant;

        // Clear displayTitle so pre-save hook regenerates it
        car.displayTitle = undefined;

        // Save
        const updatedCar = await car.save();

        console.log(`   ✅ UPDATED!`);
        console.log(`   New variant: "${updatedCar.variant}"`);
        console.log(`   New displayTitle: "${updatedCar.displayTitle}"`);
        updated++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(70)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixMissingVariants();
