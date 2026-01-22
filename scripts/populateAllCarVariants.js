/**
 * Populate variant field for all cars in database
 * This will fetch data from CheckCarDetails API and update variant field
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const checkCarDetailsClient = require('../clients/CheckCarDetailsClient');

async function populateAllCarVariants() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all cars that have registration numbers
    const cars = await Car.find({ 
      registrationNumber: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`\n📊 Found ${cars.length} cars with registration numbers`);
    console.log('='.repeat(80));

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n[${i + 1}/${cars.length}] Processing: ${car.registrationNumber}`);
      
      try {
        // Fetch data from API
        const vehicleData = await checkCarDetailsClient.getVehicleData(car.registrationNumber);
        
        if (vehicleData && vehicleData.variant) {
          // Update car with variant
          car.variant = vehicleData.variant;
          
          // Also update other fields if missing
          if (!car.engineSize && vehicleData.engineSize) {
            car.engineSize = vehicleData.engineSize;
          }
          if (!car.doors && vehicleData.doors) {
            car.doors = vehicleData.doors;
          }
          
          await car.save();
          console.log(`✅ Updated: ${car.make} ${car.model} - Variant: ${vehicleData.variant}`);
          updated++;
        } else {
          console.log(`⚠️  No variant data available`);
          skipped++;
        }
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`Total Cars: ${cars.length}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
populateAllCarVariants();
