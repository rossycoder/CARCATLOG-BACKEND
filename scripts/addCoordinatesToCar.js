require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function addCoordinatesToCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('📝 Current Car Location:');
    console.log(`   Postcode: ${car.postcode}`);
    console.log(`   Latitude: ${car.latitude || 'NOT SET'}`);
    console.log(`   Longitude: ${car.longitude || 'NOT SET'}`);
    
    // L1 1AA coordinates (Liverpool)
    const coordinates = {
      latitude: 53.4084,
      longitude: -2.9916
    };
    
    console.log('\n💡 Adding coordinates for L1 1AA (Liverpool)...');
    
    car.latitude = coordinates.latitude;
    car.longitude = coordinates.longitude;
    
    // Also set GeoJSON format for location
    car.location = {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude] // [lon, lat] for GeoJSON
    };
    
    await car.save();
    
    console.log('✅ Coordinates added successfully!');
    console.log(`   Latitude: ${car.latitude}`);
    console.log(`   Longitude: ${car.longitude}`);
    console.log('\n🎉 Car should now appear in postcode searches!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addCoordinatesToCar();
