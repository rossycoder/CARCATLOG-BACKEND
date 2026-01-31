/**
 * Check recent adverts in database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function checkRecentAdverts() {
  try {
    console.log('🔍 Checking recent adverts...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get last 5 cars
    const cars = await Car.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('advertId make model registrationNumber price createdAt advertStatus');

    console.log(`Found ${cars.length} recent cars:\n`);

    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.make} ${car.model}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

checkRecentAdverts();
