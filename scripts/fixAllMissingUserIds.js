require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixAllMissingUserIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars without userId but with seller email
    const carsWithoutUserId = await Car.find({
      userId: { $exists: false },
      'sellerContact.email': { $exists: true }
    });
    
    console.log(`📊 Found ${carsWithoutUserId.length} car(s) without userId\n`);

    if (carsWithoutUserId.length === 0) {
      console.log('✅ All cars have userId set!');
      process.exit(0);
    }

    for (const car of carsWithoutUserId) {
      console.log(`🚗 Processing car: ${car.make} ${car.model} (${car.registrationNumber})`);
      console.log(`   Email: ${car.sellerContact.email}`);
      
      // Find user by email
      const user = await User.findOne({ email: car.sellerContact.email });
      
      if (user) {
        car.userId = user._id;
        await car.save();
        console.log(`   ✅ User ID set: ${user._id}\n`);
      } else {
        console.log(`   ⚠️  No user found for email: ${car.sellerContact.email}\n`);
      }
    }

    console.log('🎉 All missing user IDs fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllMissingUserIds();
