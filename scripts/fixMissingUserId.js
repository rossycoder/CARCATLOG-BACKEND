require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixMissingUserId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car with missing userId
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Current userId: ${car.userId || 'MISSING'}`);
    console.log(`   Seller email: ${car.sellerContact?.email}`);

    if (car.userId) {
      console.log('✅ Car already has userId set');
      return;
    }

    if (!car.sellerContact?.email) {
      console.log('❌ No seller email found - cannot link to user');
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: car.sellerContact.email });
    
    if (!user) {
      console.log(`❌ No user found with email: ${car.sellerContact.email}`);
      console.log('💡 User might need to register first');
      return;
    }

    console.log(`👤 Found user: ${user._id}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.createdAt}`);

    // Update car with userId
    console.log('🔧 Updating car with userId...');
    
    const updatedCar = await Car.findByIdAndUpdate(
      car._id,
      { 
        userId: user._id,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (updatedCar) {
      console.log('✅ Car updated successfully!');
      console.log(`   New userId: ${updatedCar.userId}`);
      console.log('🎉 Car should now appear in My Listings');
    } else {
      console.log('❌ Failed to update car');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMissingUserId();