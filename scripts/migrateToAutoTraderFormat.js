/**
 * Migration Script: AutoTrader Data Normalization
 * Fixes existing database records to be AutoTrader compliant
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { normalizeVehicleData } = require('../utils/vehicleDataNormalizer');

async function migrateToAutoTraderFormat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all cars
    const cars = await Car.find({});
    console.log(`\n📊 Found ${cars.length} vehicles to process\n`);

    let processed = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const car of cars) {
      try {
        processed++;
        
        // Normalize the vehicle data
        const normalized = normalizeVehicleData(car.toObject());
        
        // Track what changed
        const changes = [];
        
        // Update engine size
        if (car.engineSize !== normalized.engineSize) {
          changes.push(`engineSize: ${car.engineSize} → ${normalized.engineSize}`);
          car.engineSize = normalized.engineSize;
        }
        
        // Update submodel (trim only)
        if (car.submodel !== normalized.submodel) {
          changes.push(`submodel: "${car.submodel}" → "${normalized.submodel}"`);
          car.submodel = normalized.submodel;
        }
        
        // Add/update variant
        if (!car.variant || car.variant !== normalized.variant) {
          changes.push(`variant: "${car.variant || 'null'}" → "${normalized.variant}"`);
          car.variant = normalized.variant;
        }
        
        // Sanitize description
        if (car.description !== normalized.description) {
          const oldDesc = car.description?.substring(0, 50) || '';
          const newDesc = normalized.description?.substring(0, 50) || '';
          changes.push(`description: "${oldDesc}..." → "${newDesc}..."`);
          car.description = normalized.description;
        }
        
        // Add display title
        car.displayTitle = normalized.displayTitle;
        
        if (changes.length > 0) {
          await car.save();
          updated++;
          console.log(`✅ Updated ${car.make} ${car.model} (${car.registrationNumber || car._id})`);
          changes.forEach(change => console.log(`   - ${change}`));
        }
        
        if (processed % 50 === 0) {
          console.log(`\n📈 Progress: ${processed}/${cars.length} processed, ${updated} updated\n`);
        }
        
      } catch (error) {
        errors++;
        const errorMsg = `${car.registrationNumber || car._id}: ${error.message}`;
        errorDetails.push(errorMsg);
        console.error(`❌ Error processing ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total vehicles: ${cars.length}`);
    console.log(`Processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    if (errorDetails.length > 0) {
      console.log('\n❌ Errors:');
      errorDetails.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
migrateToAutoTraderFormat();
