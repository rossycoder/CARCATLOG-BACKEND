require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Bike = require('../models/Bike');
const Van = require('../models/Van');

async function verifyLocationNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check Cars
    console.log('🚗 Cars:');
    const cars = await Car.find({ locationName: { $exists: true } }).limit(5);
    cars.forEach(car => {
      console.log(`  ${car.make} ${car.model} - Location: "${car.locationName}" (${car.postcode})`);
    });
    
    // Check Bikes
    console.log('\n🏍️  Bikes:');
    const bikes = await Bike.find({ locationName: { $exists: true } }).limit(5);
    bikes.forEach(bike => {
      console.log(`  ${bike.make} ${bike.model} - Location: "${bike.locationName}" (${bike.postcode})`);
    });
    
    // Check Vans
    console.log('\n🚐 Vans:');
    const vans = await Van.find({ locationName: { $exists: true } }).limit(5);
    vans.forEach(van => {
      console.log(`  ${van.make} ${van.model} - Location: "${van.locationName}" (${van.postcode})`);
    });
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyLocationNames();
