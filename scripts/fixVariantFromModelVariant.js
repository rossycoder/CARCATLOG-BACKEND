/**
 * Fix script to populate variant field from API's modelVariant
 * For cars that have registration but missing/null variant
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');
const dataMerger = require('../utils/dataMerger');

async function fixVariantFromModelVariant() {
  try {
    console.log('🔧 Fixing variant field from API modelVariant...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find cars with registration but missing/null/invalid variant
    const carsToFix = await Car.find({
      registrationNumber: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { variant: null },
        { variant: '' },
        { variant: 'null' },
        { variant: 'undefined' }
      ]
    });
    
    console.log(`Found ${carsToFix.length} cars to fix\n`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const car of carsToFix) {
      try {
        console.log(`\n🔍 Processing: ${car.make} ${car.model} (${car.registrationNumber})`);
        
        // Fetch fresh data from API
        const apiData = await checkCarDetailsClient.getVehicleData(car.registrationNumber);
        
        if (!apiData) {
          console.log(`   ⚠️  No API data available`);
          failed++;
          continue;
        }
        
        // Merge data
        const merged = dataMerger.merge(apiData, null);
        
        // Get variant from merged data
        const newVariant = merged.variant?.value;
        
        if (newVariant && newVariant !== 'null' && newVariant !== 'undefined' && newVariant.trim() !== '') {
          car.variant = newVariant;
          await car.save();
          console.log(`   ✅ Updated variant: "${newVariant}"`);
          fixed++;
        } else {
          console.log(`   ⚠️  No valid variant found in API`);
          failed++;
        }
        
        // Rate limiting - wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n\n📊 SUMMARY:`);
    console.log(`   Total cars: ${carsToFix.length}`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Failed: ${failed}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixVariantFromModelVariant();
