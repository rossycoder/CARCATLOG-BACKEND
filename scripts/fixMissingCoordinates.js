const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

dotenv.config();

async function fixMissingCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB\n');

    // Find all cars missing coordinates
    const carsWithoutCoords = await Car.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null }
      ]
    });

    console.log(`🔧 Found ${carsWithoutCoords.length} cars missing coordinates\n`);

    if (carsWithoutCoords.length === 0) {
      console.log('✅ All cars have coordinates!');
      mongoose.connection.close();
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const car of carsWithoutCoords) {
      try {
        // Skip if no postcode
        if (!car.postcode) {
          console.log(`⏭️  Skipping ${car.year} ${car.make} ${car.model} - No postcode`);
          failed++;
          continue;
        }

        console.log(`🔍 Looking up postcode for ${car.year} ${car.make} ${car.model}: ${car.postcode}`);
        
        // Lookup postcode coordinates
        const postcodeData = await postcodeService.lookupPostcode(car.postcode);
        
        // Update car with coordinates
        car.latitude = postcodeData.latitude;
        car.longitude = postcodeData.longitude;
        car.locationName = postcodeData.locationName;
        car.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
        
        await car.save();
        console.log(`✅ Updated: ${car.year} ${car.make} ${car.model} → (${postcodeData.latitude}, ${postcodeData.longitude})\n`);
        updated++;
      } catch (err) {
        console.log(`❌ Failed to update ${car.year} ${car.make} ${car.model}: ${err.message}\n`);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${updated} cars`);
    console.log(`❌ Failed: ${failed} cars`);

    mongoose.connection.close();
    console.log('\n✅ Fix complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMissingCoordinates();
