const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

dotenv.config();

async function diagnosePostcodeSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB\n');

    // Check 1: Count total cars
    const totalCars = await Car.countDocuments();
    console.log(`📊 Total cars in database: ${totalCars}`);

    // Check 2: Count cars with latitude/longitude
    const carsWithCoords = await Car.countDocuments({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });
    console.log(`📍 Cars with latitude/longitude: ${carsWithCoords}`);
    console.log(`❌ Cars missing coordinates: ${totalCars - carsWithCoords}\n`);

    // Check 3: Sample cars without coordinates
    if (totalCars - carsWithCoords > 0) {
      console.log('🔍 Sample cars missing coordinates:');
      const carsWithoutCoords = await Car.find({
        $or: [
          { latitude: { $exists: false } },
          { longitude: { $exists: false } },
          { latitude: null },
          { longitude: null }
        ]
      }).limit(3).select('make model year postcode latitude longitude');

      carsWithoutCoords.forEach((car, i) => {
        console.log(`  ${i + 1}. ${car.year} ${car.make} ${car.model} - Postcode: ${car.postcode || 'N/A'}`);
      });
    }

    // Check 4: Test postcode lookup
    console.log('\n🧪 Testing postcode lookup:');
    try {
      const result = await postcodeService.lookupPostcode('SW1A 1AA');
      console.log(`✅ Postcode lookup works: SW1A 1AA → (${result.latitude}, ${result.longitude})`);
    } catch (err) {
      console.log(`❌ Postcode lookup failed: ${err.message}`);
    }

    // Check 5: Test search with sample coordinates
    console.log('\n🔎 Testing search with sample coordinates:');
    try {
      const results = await postcodeService.searchCarsByLocation(51.5014, -0.1419, 25);
      console.log(`✅ Search returned ${results.length} cars within 25 miles of London`);
      if (results.length > 0) {
        console.log(`   Sample: ${results[0].year} ${results[0].make} ${results[0].model} - ${results[0].distance} miles away`);
      }
    } catch (err) {
      console.log(`❌ Search failed: ${err.message}`);
    }

    mongoose.connection.close();
    console.log('\n✅ Diagnosis complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosePostcodeSearch();
