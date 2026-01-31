require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');
const haversine = require('../utils/haversine');

async function testDistanceCalculation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a car with coordinates
    const car = await Car.findOne({ 
      coordinates: { $exists: true },
      advertStatus: 'active'
    });

    if (!car) {
      console.log('❌ No cars with coordinates found');
      return;
    }

    console.log('\n📍 Testing distance calculation for car:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Location: ${car.locationName}`);
    console.log(`   Coordinates: ${car.coordinates.latitude}, ${car.coordinates.longitude}`);
    console.log(`   Car ID: ${car._id}`);

    // Test with Liverpool postcode
    const testPostcode = 'L1 8JQ'; // Liverpool city center
    console.log(`\n🔍 Calculating distance from ${testPostcode}...`);

    const userCoords = await postcodeService.getCoordinates(testPostcode);
    console.log(`   User coordinates: ${userCoords.latitude}, ${userCoords.longitude}`);

    const distance = haversine(
      userCoords.latitude,
      userCoords.longitude,
      car.coordinates.latitude,
      car.coordinates.longitude
    );

    console.log(`\n✅ Distance calculated: ${Math.round(distance)} miles`);
    console.log(`\n📝 To test in browser:`);
    console.log(`   1. Search for cars with postcode: ${testPostcode}`);
    console.log(`   2. Click on any car to view details`);
    console.log(`   3. You should see "${Math.round(distance)} miles away" next to the location`);
    console.log(`\n   Or directly visit: http://localhost:5173/cars/${car._id}`);
    console.log(`   API endpoint: http://localhost:5000/api/vehicles/${car._id}?postcode=${encodeURIComponent(testPostcode)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testDistanceCalculation();
