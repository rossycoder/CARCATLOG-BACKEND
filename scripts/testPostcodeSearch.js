require('dotenv').config();
const mongoose = require('mongoose');
const postcodeService = require('../services/postcodeService');

async function testPostcodeSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test postcode near the car location (EC1A 1BB)
    const testPostcode = 'EC1A 1BB';
    const radius = 25; // miles

    console.log(`🔍 Searching for cars near ${testPostcode} within ${radius} miles...\n`);

    // Lookup postcode coordinates
    const postcodeData = await postcodeService.lookupPostcode(testPostcode);
    console.log(`📍 Postcode coordinates: ${postcodeData.latitude}, ${postcodeData.longitude}\n`);

    // Search for cars
    const cars = await postcodeService.searchCarsByLocation(
      postcodeData.latitude,
      postcodeData.longitude,
      radius
    );

    console.log(`Found ${cars.length} car(s):\n`);

    cars.forEach(car => {
      console.log(`- ${car.make} ${car.model}`);
      console.log(`  Registration: ${car.registrationNumber}`);
      console.log(`  Price: £${car.price}`);
      console.log(`  Location: ${car.postcode}`);
      console.log(`  Distance: ${car.distance} miles`);
      console.log(`  Status: ${car.advertStatus}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testPostcodeSearch();
