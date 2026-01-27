/**
 * Find Recent Cars
 * 
 * This script shows the most recently created cars
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function findRecentCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the 10 most recent cars
    const cars = await Car.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id make model registrationNumber price advertStatus userId createdAt publishedAt sellerContact.email');

    console.log(`\n📊 10 Most Recent Cars:\n`);

    for (const car of cars) {
      console.log(`\n🚗 ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Price: £${car.price || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   User ID: ${car.userId || 'MISSING'}`);
      console.log(`   Email: ${car.sellerContact?.email || 'N/A'}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   Published: ${car.publishedAt || 'Not published'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
findRecentCars();
