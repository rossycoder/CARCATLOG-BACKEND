const mongoose = require('mongoose');
require('dotenv').config();

const Car = require('./models/Car');
const { formatColor } = require('./utils/colorFormatter');

/**
 * Fix all car colors to proper case
 * Converts "GREY" to "Grey", "WHITE" to "White", etc.
 */
async function fixAllColors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all cars with colors
    const cars = await Car.find({
      color: { $exists: true, $ne: null }
    });

    console.log(`📋 Found ${cars.length} cars with colors\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const car of cars) {
      const originalColor = car.color;
      
      // Skip if already null or empty
      if (!originalColor || originalColor === 'null' || originalColor === 'undefined') {
        skippedCount++;
        continue;
      }

      // Format color
      const formattedColor = formatColor(originalColor);

      // Check if color needs updating
      if (formattedColor && formattedColor !== originalColor) {
        console.log(`🔄 ${car.registrationNumber}: "${originalColor}" → "${formattedColor}"`);
        car.color = formattedColor;
        await car.save();
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Color Formatting Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Updated: ${updatedCount} cars`);
    console.log(`⏭️  Skipped: ${skippedCount} cars (already formatted or null)`);
    console.log(`📊 Total: ${cars.length} cars processed`);

    // Show sample of updated colors
    if (updatedCount > 0) {
      console.log('\n📋 Sample of Updated Colors:');
      const updatedCars = await Car.find({
        color: { $exists: true, $ne: null }
      }).limit(5);

      updatedCars.forEach(car => {
        console.log(`   ${car.registrationNumber}: ${car.color}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAllColors();
