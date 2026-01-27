const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Car = require('../models/Car');
const User = require('../models/User');

async function assignCarsToUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the user
    const user = await User.findOne({ email: 'rozeena031@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 Found user: ${user.email}`);
    console.log(`   User ID: ${user._id}`);

    // Find all cars without userId
    const carsWithoutUserId = await Car.find({ userId: { $exists: false } });
    
    console.log(`\n🚗 Found ${carsWithoutUserId.length} cars without userId`);
    console.log('\n🔧 Assigning cars to user...\n');

    let updated = 0;
    for (const car of carsWithoutUserId) {
      car.userId = user._id;
      await car.save();
      console.log(`✅ ${car.registrationNumber} (${car.make} ${car.model}) - Status: ${car.advertStatus}`);
      updated++;
    }

    console.log(`\n✅ Successfully assigned ${updated} cars to user ${user.email}`);

    // Show summary
    const userCars = await Car.find({ userId: user._id });
    console.log(`\n📊 Summary:`);
    console.log(`   Total cars for ${user.email}: ${userCars.length}`);
    
    const activeCars = userCars.filter(c => c.advertStatus === 'active');
    const incompleteCars = userCars.filter(c => c.advertStatus === 'incomplete');
    
    console.log(`   - Active: ${activeCars.length}`);
    console.log(`   - Incomplete: ${incompleteCars.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

assignCarsToUser();
