require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

/**
 * Automatically fix ALL car variants by fetching fresh data from CheckCarDetails API
 * This will extract the proper ModelVariant (like "S TDI CR") and regenerate displayTitles
 */

async function autoFixAllVariantsFromAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('='.repeat(70));
    console.log('AUTO-FIX ALL VARIANTS FROM API');
    console.log('='.repeat(70));
    
    // Find all cars with registration numbers
    const cars = await Car.find({
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`\n📊 Found ${cars.length} cars with registration numbers\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const car of cars) {
      try {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`🚗 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`   Current variant: "${car.variant}"`);
        console.log(`   Current displayTitle: "${car.displayTitle}"`);
        
        // Fetch fresh data from API
        console.log(`   📡 Fetching API data...`);
        const apiData = await CheckCarDetailsClient.getVehicleData(car.registrationNumber);
        
        if (!apiData) {
          console.log(`   ⚠️  No API data available - skipping`);
          skipped++;
          continue;
        }
        
        // Extract modelVariant from API (this is the proper AutoTrader-style variant)
        const apiVariant = apiData.modelVariant || apiData.variant;
        
        console.log(`   📝 API variant: "${apiVariant}"`);
        
        // Check if variant needs updating
        if (!apiVariant || apiVariant === 'null' || apiVariant === 'undefined' || apiVariant.trim() === '') {
          console.log(`   ⚠️  No valid variant in API data - skipping`);
          skipped++;
          continue;
        }
        
        // Check if already correct
        if (car.variant === apiVariant) {
          console.log(`   ✅ Variant already correct - skipping`);
          skipped++;
          continue;
        }
        
        // Update variant
        car.variant = apiVariant;
        
        // Clear displayTitle so pre-save hook regenerates it
        car.displayTitle = null;
        
        // Save (pre-save hook will auto-generate displayTitle)
        await car.save();
        
        // Reload to see the generated displayTitle
        await car.populate('_id');
        const updatedCar = await Car.findById(car._id);
        
        console.log(`   ✅ UPDATED!`);
        console.log(`   New variant: "${updatedCar.variant}"`);
        console.log(`   New displayTitle: "${updatedCar.displayTitle}"`);
        
        updated++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total cars processed: ${cars.length}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(70));
    
    if (updated > 0) {
      console.log(`\n🎯 Successfully updated ${updated} cars with AutoTrader-style variants!`);
    }
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

autoFixAllVariantsFromAPI();
