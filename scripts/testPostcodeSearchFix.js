const mongoose = require('mongoose');
const dotenv = require('dotenv');
const postcodeService = require('../services/postcodeService');

dotenv.config();

async function testPostcodeSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-website');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Search near Liverpool (L1 8JQ)
    console.log('🧪 Test 1: Search near Liverpool (L1 8JQ)');
    try {
      const postcodeData = await postcodeService.lookupPostcode('L1 8JQ');
      console.log(`   Postcode: ${postcodeData.postcode}`);
      console.log(`   Coordinates: (${postcodeData.latitude}, ${postcodeData.longitude})`);
      
      const results = await postcodeService.searchCarsByLocation(
        postcodeData.latitude,
        postcodeData.longitude,
        25
      );
      console.log(`   ✅ Found ${results.length} cars within 25 miles\n`);
      
      if (results.length > 0) {
        results.forEach((car, i) => {
          console.log(`      ${i + 1}. ${car.year} ${car.make} ${car.model} - ${car.distance} miles away`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }

    // Test 2: Search near London (SW1A 1AA)
    console.log('\n🧪 Test 2: Search near London (SW1A 1AA)');
    try {
      const postcodeData = await postcodeService.lookupPostcode('SW1A 1AA');
      console.log(`   Postcode: ${postcodeData.postcode}`);
      console.log(`   Coordinates: (${postcodeData.latitude}, ${postcodeData.longitude})`);
      
      const results = await postcodeService.searchCarsByLocation(
        postcodeData.latitude,
        postcodeData.longitude,
        25
      );
      console.log(`   ✅ Found ${results.length} cars within 25 miles\n`);
      
      if (results.length > 0) {
        results.forEach((car, i) => {
          console.log(`      ${i + 1}. ${car.year} ${car.make} ${car.model} - ${car.distance} miles away`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }

    // Test 3: Search with larger radius
    console.log('\n🧪 Test 3: Search with 100 mile radius from London');
    try {
      const postcodeData = await postcodeService.lookupPostcode('SW1A 1AA');
      const results = await postcodeService.searchCarsByLocation(
        postcodeData.latitude,
        postcodeData.longitude,
        100
      );
      console.log(`   ✅ Found ${results.length} cars within 100 miles\n`);
      
      if (results.length > 0) {
        results.forEach((car, i) => {
          console.log(`      ${i + 1}. ${car.year} ${car.make} ${car.model} - ${car.distance} miles away`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }

    mongoose.connection.close();
    console.log('\n✅ All tests complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPostcodeSearch();
