/**
 * Migration Script: Update Display Titles for Existing Hybrid Cars
 * This updates all existing hybrid cars to show "Petrol Hybrid" or "Diesel Hybrid"
 * in their display titles instead of just "Hybrid"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

async function migrateHybridDisplayTitles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all hybrid cars
    const hybridCars = await Car.find({ fuelType: 'Hybrid' });
    console.log(`\n📊 Found ${hybridCars.length} hybrid cars to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const car of hybridCars) {
      console.log(`\n🔍 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Current displayTitle: "${car.displayTitle}"`);
      
      // Regenerate display title with new logic
      const parts = [];
      
      // Add engine size
      if (car.engineSize) {
        const size = parseFloat(car.engineSize);
        if (!isNaN(size) && size > 0) {
          const sizeInLitres = size > 100 ? size / 1000 : size;
          const rounded = Math.round(sizeInLitres * 2) / 2;
          parts.push(rounded.toFixed(1));
        }
      }
      
      // Add specific hybrid type (Petrol Hybrid or Diesel Hybrid)
      const variantLower = (car.variant || '').toLowerCase();
      if (variantLower.includes('diesel') || variantLower.includes('tdi') || variantLower.includes('hdi')) {
        parts.push('Diesel Hybrid');
      } else {
        parts.push('Petrol Hybrid');
      }
      
      // Add variant
      if (car.variant && car.variant !== 'null' && car.variant !== 'undefined' && car.variant.trim() !== '') {
        parts.push(car.variant.trim());
      }
      
      // Add body type if not in variant
      if (car.bodyType && car.bodyType !== 'null' && car.bodyType !== 'undefined') {
        const bodyTypeInVariant = car.variant && 
          (car.variant.toLowerCase().includes(car.bodyType.toLowerCase()) ||
           car.variant.toLowerCase().includes('van') ||
           car.variant.toLowerCase().includes('panel'));
        
        if (!bodyTypeInVariant) {
          parts.push(car.bodyType);
        }
      }
      
      // Add doors
      if (car.doors && car.doors >= 2 && car.doors <= 5) {
        parts.push(`${car.doors}dr`);
      }
      
      const newDisplayTitle = parts.join(' ');
      
      // Only update if changed
      if (newDisplayTitle !== car.displayTitle) {
        car.displayTitle = newDisplayTitle;
        await car.save();
        console.log(`   ✅ Updated to: "${newDisplayTitle}"`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  Skipped (no change needed)`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Migration Summary:');
    console.log(`   Total hybrid cars: ${hybridCars.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('='.repeat(80));

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrateHybridDisplayTitles();
