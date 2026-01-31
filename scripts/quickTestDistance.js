require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function quickTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find any active car
    const car = await Car.findOne({ advertStatus: 'active' });

    if (!car) {
      console.log('❌ No active cars found');
      return;
    }

    console.log('\n📍 Found car:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Location: ${car.locationName}`);
    console.log(`   Postcode: ${car.postcode}`);
    console.log(`   Has coordinates: ${!!car.coordinates}`);
    console.log(`   Car ID: ${car._id}`);

    if (!car.coordinates && car.postcode) {
      console.log('\n🔧 Adding coordinates from postcode...');
      const postcodeService = require('../services/postcodeService');
      const postcodeData = await postcodeService.lookupPostcode(car.postcode);
      
      if (postcodeData) {
        car.coordinates = {
          latitude: postcodeData.latitude,
          longitude: postcodeData.longitude
        };
        await car.save();
        console.log(`✅ Coordinates added: ${postcodeData.latitude}, ${postcodeData.longitude}`);
      }
    }

    console.log(`\n📝 Test the API:`);
    console.log(`   http://localhost:5000/api/vehicles/${car._id}?postcode=L1 8JQ`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();
