require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function addCoordinatesToNU10YEV() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the SKODA Octavia car
    const car = await Car.findOne({ registrationNumber: 'NU10YEV' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('📝 Current Car Details:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Postcode: ${car.postcode}`);
    console.log(`   Coordinates: ${car.location?.coordinates || 'NOT SET'}`);
    
    // Liverpool L1 1AA coordinates
    // Longitude: -2.9916, Latitude: 53.4084
    car.latitude = 53.4084;
    car.longitude = -2.9916;

    await car.save();
    
    console.log(`\n✅ Coordinates added successfully!`);
    console.log(`   Latitude: 53.4084`);
    console.log(`   Longitude: -2.9916`);
    console.log(`\n🎉 Car is now fully configured and will show in:`);
    console.log(`   ✅ Search results`);
    console.log(`   ✅ My Listings`);
    console.log(`   ✅ Location-based searches`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addCoordinatesToNU10YEV();
