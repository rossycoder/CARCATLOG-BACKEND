/**
 * Check User Cars - Detailed
 * 
 * This script shows detailed information about a user's cars
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function checkUserCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const userEmail = 'rozeena031@gmail.com';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`   ID: ${user._id}`);

    // Find all cars for this user
    const cars = await Car.find({ userId: user._id }).sort({ createdAt: -1 });

    console.log(`\n📊 Found ${cars.length} cars for this user\n`);

    for (const car of cars) {
      console.log(`\n🚗 Car ${car._id}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Price: £${car.price || 'N/A'}`);
      console.log(`   Status: ${car.advertStatus}`);
      console.log(`   Advert ID: ${car.advertId || 'N/A'}`);
      console.log(`   Created: ${car.createdAt}`);
      console.log(`   Published: ${car.publishedAt || 'N/A'}`);
      console.log(`   User ID: ${car.userId || 'MISSING'}`);
    }

    // Also check for cars without userId but with matching email
    const carsWithoutUserId = await Car.find({
      'sellerContact.email': userEmail,
      userId: { $exists: false }
    });

    if (carsWithoutUserId.length > 0) {
      console.log(`\n⚠️  Found ${carsWithoutUserId.length} cars with matching email but no userId:`);
      for (const car of carsWithoutUserId) {
        console.log(`   - ${car._id}: ${car.make} ${car.model} (${car.registrationNumber})`);
      }
    }

    // Check for cars with null userId
    const carsWithNullUserId = await Car.find({
      'sellerContact.email': userEmail,
      userId: null
    });

    if (carsWithNullUserId.length > 0) {
      console.log(`\n⚠️  Found ${carsWithNullUserId.length} cars with null userId:`);
      for (const car of carsWithNullUserId) {
        console.log(`   - ${car._id}: ${car.make} ${car.model} (${car.registrationNumber})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
checkUserCars();
