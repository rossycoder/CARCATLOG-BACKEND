/**
 * Check all cars in database regardless of status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all cars regardless of status
    const allCars = await Car.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log(`\n📊 Total cars in database: ${allCars.length}`);
    
    if (allCars.length === 0) {
      console.log('❌ No cars found in database at all');
      
      // Check if the collection exists
      const collections = await mongoose.connection.db.listCollections().toArray();
      const carCollection = collections.find(c => c.name === 'cars');
      
      if (carCollection) {
        console.log('✅ Cars collection exists but is empty');
      } else {
        console.log('❌ Cars collection does not exist');
      }
      
    } else {
      console.log('\n🚗 Recent cars:');
      allCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.registrationNumber})`);
        console.log(`   ID: ${car._id}`);
        console.log(`   Advert ID: ${car.advertId}`);
        console.log(`   Status: ${car.advertStatus}`);
        console.log(`   Created: ${car.createdAt}`);
        console.log(`   Price: £${car.price}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllCars();