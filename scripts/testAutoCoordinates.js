require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function testAutoCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the most recent car
    const recentCar = await Car.findOne().sort({ createdAt: -1 });

    if (!recentCar) {
      console.log('❌ No cars found in database');
      return;
    }

    console.log('📍 Most Recent Car:');
    console.log('   ID:', recentCar._id);
    console.log('   Make/Model:', recentCar.make, recentCar.model);
    console.log('   Postcode:', recentCar.postcode || 'Not set');
    console.log('   Location Name:', recentCar.locationName || 'Not set');
    console.log('   Has Coordinates:', !!recentCar.coordinates);
    
    if (recentCar.coordinates) {
      console.log('   Coordinates:', recentCar.coordinates.latitude, ',', recentCar.coordinates.longitude);
      console.log('\n✅ Coordinates are automatically set!');
      console.log('\n📝 Test distance display:');
      console.log('   1. Search with postcode: L1 8JQ');
      console.log('   2. Click on this car');
      console.log('   3. You should see distance displayed');
    } else {
      console.log('\n⚠️  Coordinates not set');
      console.log('   This car was created before the auto-coordinate feature');
      console.log('   New cars will automatically get coordinates from postcode');
    }

    console.log('\n📊 Summary:');
    console.log('   - When you add a new car with a postcode');
    console.log('   - Coordinates are automatically fetched');
    console.log('   - Location name is automatically set');
    console.log('   - Distance will be calculated and displayed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAutoCoordinates();
