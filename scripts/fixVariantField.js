/**
 * Fix Variant Field Script
 * Updates all cars with missing variant field by fetching fresh API data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const CheckCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function fixVariantField() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find all cars with registration numbers but missing variant
    const carsToFix = await Car.find({
      registrationNumber: { $exists: true, $ne: null },
      $or: [
        { variant: { $exists: false } },
        { variant: null },
        { variant: '' }
      ]
    }).limit(100); // Process in batches

    console.log(`Found ${carsToFix.length} cars with missing variant field`);

    let successCount = 0;
    let failCount = 0;

    for (const car of carsToFix) {
      try {
        console.log(`\nProcessing ${car.registrationNumber}...`);
        
        // Fetch fresh data from API
        const apiData = await CheckCarDetailsClient.getVehicleData(car.registrationNumber);
        
        // Extract variant from API data with proper validation
        let variant = null;
        if (apiData.variant && apiData.variant !== 'null' && apiData.variant !== 'undefined' && apiData.variant.trim() !== '') {
          variant = apiData.variant;
        } else if (apiData.modelVariant && apiData.modelVariant !== 'null' && apiData.modelVariant !== 'undefined' && apiData.modelVariant.trim() !== '') {
          variant = apiData.modelVariant;
        }
        
        if (variant) {
          // Update the car record
          car.variant = variant;
          
          // Also update displayTitle if needed
          if (!car.displayTitle || !car.displayTitle.includes(variant)) {
            const parts = [];
            if (car.make) parts.push(car.make);
            if (car.model) parts.push(car.model);
            if (car.engineSize) parts.push(`${car.engineSize.toFixed(1)}L`);
            if (variant) parts.push(variant);
            if (car.fuelType) parts.push(car.fuelType);
            
            car.displayTitle = parts.join(' ');
          }
          
          await car.save();
          console.log(`✅ Updated ${car.registrationNumber} with variant: ${variant}`);
          successCount++;
        } else {
          console.log(`⚠️  No variant data available for ${car.registrationNumber}`);
          failCount++;
        }
        
        // Rate limiting - wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${car.registrationNumber}:`, error.message);
        failCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total processed: ${carsToFix.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
fixVariantField();
