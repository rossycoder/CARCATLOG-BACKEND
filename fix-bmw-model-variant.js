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
    const Car = require('./models/Car');
    const bmwSeriesPattern = /^\d\s*Series$/i;

    // Find all BMW cars where variant looks like "X Series" but model does not
    const cars = await Car.find({ make: /^BMW$/i });
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
          fixed++;
        } catch (saveErr) {
          skipped++;
        }
      } else if (modelIsSeriesName) {
        alreadyCorrect++;
      } else {
        // Neither matches the pattern — unusual, skip
        skipped++;
      }
    }
    await mongoose.disconnect();
  } catch (error) {
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixBMWModelVariantSwap();
