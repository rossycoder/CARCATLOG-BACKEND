require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function populateAllCarVariantsFull() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find ALL cars that don't have a submodel or have an empty submodel
    const carsWithoutVariant = await Car.find({
      $or: [
        { submodel: { $exists: false } },
        { submodel: null },
        { submodel: '' }
      ],
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Found ${carsWithoutVariant.length} cars without model variant\n`);
    console.log('Starting full migration...\n');

    let updated = 0;
    let failed = 0;
    let noData = 0;
    let processed = 0;

    for (const car of carsWithoutVariant) {
      processed++;
      try {
        console.log(`[${processed}/${carsWithoutVariant.length}] ${car.make} ${car.model} (${car.registrationNumber})`);
        
        // Call CheckCarDetails API - this returns parsed data
        const vehicleData = await checkCarDetailsClient.getVehicleData(car.registrationNumber);
        
        if (vehicleData && vehicleData.modelVariant) {
          car.submodel = vehicleData.modelVariant.trim();
          await car.save();
          console.log(`  ✅ Updated: ${vehicleData.modelVariant}`);
          updated++;
        } else {
          console.log(`  ⚠️  No variant data available`);
          noData++;
        }
        
        // Add delay to avoid rate limiting (1.5 seconds between requests)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FULL MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total processed: ${carsWithoutVariant.length}`);
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`⚠️  No variant data available: ${noData}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    // Run final audit
    console.log('\nRunning final audit...\n');
    const totalCars = await Car.countDocuments();
    const carsWithVariant = await Car.countDocuments({
      submodel: { $exists: true, $ne: null, $ne: '' }
    });
    const percentage = ((carsWithVariant / totalCars) * 100).toFixed(1);

    console.log('='.repeat(60));
    console.log('FINAL STATUS');
    console.log('='.repeat(60));
    console.log(`Total cars: ${totalCars}`);
    console.log(`Cars with variants: ${carsWithVariant} (${percentage}%)`);
    console.log(`Cars without variants: ${totalCars - carsWithVariant}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

populateAllCarVariantsFull();
