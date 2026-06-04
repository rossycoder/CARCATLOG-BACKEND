/**
 * Fix BMW cars where model and variant are swapped in the database.
 * 
 * CORRECT assignment:
 *   model   = short base name  e.g. "5 Series"
 *   variant = detailed trim    e.g. "530D XDRIVE M SPORT MHEV AUTO"
 * 
 * This script finds all BMW cars where variant contains the "X Series" pattern
 * but model does not, and swaps them.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixBMWModelVariantSwap() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Car = require('./models/Car');
    const bmwSeriesPattern = /^\d\s*Series$/i;

    // Find all BMW cars where variant looks like "X Series" but model does not
    const cars = await Car.find({ make: /^BMW$/i });
    console.log(`\n🔍 Found ${cars.length} BMW cars to check`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let skipped = 0;

    for (const car of cars) {
      const modelIsSeriesName = bmwSeriesPattern.test((car.model || '').trim());
      const variantIsSeriesName = bmwSeriesPattern.test((car.variant || '').trim());

      if (variantIsSeriesName && !modelIsSeriesName) {
        // Swapped: variant has "X Series", model has the trim detail
        const oldModel = car.model;
        const oldVariant = car.variant;

        car.model = oldVariant;   // e.g. "5 Series"
        car.variant = oldModel;   // e.g. "530D XDRIVE M SPORT MHEV AUTO"
        car.skipNormalization = false; // allow normalization to clean up further

        try {
          await Car.updateOne(
            { _id: car._id },
            { $set: { model: car.model, variant: car.variant } }
          );
          console.log(`\n✅ Fixed: ${car.registrationNumber}`);
          console.log(`   model:   "${oldModel}" → "${car.model}"`);
          console.log(`   variant: "${oldVariant}" → "${car.variant}"`);
          fixed++;
        } catch (saveErr) {
          console.error(`❌ Failed to fix ${car.registrationNumber}:`, saveErr.message);
          skipped++;
        }
      } else if (modelIsSeriesName) {
        alreadyCorrect++;
      } else {
        // Neither matches the pattern — unusual, skip
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed:          ${fixed}`);
    console.log(`   Already correct: ${alreadyCorrect}`);
    console.log(`   Skipped:        ${skipped}`);

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixBMWModelVariantSwap();
