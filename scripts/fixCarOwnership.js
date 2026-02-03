require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixCarOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car
    const registration = 'EK11XHZ';
    const car = await Car.findOne({ registrationNumber: registration });
    
    if (!car) {
      console.log('❌ Car not found with registration:', registration);
      return;
    }

    // Find the correct user (the one who is actually logged in)
    const correctUserEmail = 'rozeena031@gmail.com';
    const correctUser = await User.findOne({ email: correctUserEmail });
    
    if (!correctUser) {
      console.log('❌ User not found with email:', correctUserEmail);
      return;
    }

    console.log(`🚗 Car: ${car.advertId}`);
    console.log(`   Current userId: ${car.userId}`);
    console.log(`   Current seller email: ${car.sellerContact?.email}`);
    console.log('');
    console.log(`👤 Correct user: ${correctUser._id}`);
    console.log(`   Email: ${correctUser.email}`);

    // Update car to belong to the correct user
    console.log('🔧 Updating car ownership...');
    
    const updatedCar = await Car.findByIdAndUpdate(
      car._id,
      { 
        userId: correctUser._id,
        'sellerContact.email': correctUser.email, // Also update seller email
        updatedAt: new Date()
      },
      { new: true }
    );

    if (updatedCar) {
      console.log('✅ Car ownership updated successfully!');
      console.log(`   New userId: ${updatedCar.userId}`);
      console.log(`   New seller email: ${updatedCar.sellerContact.email}`);
      console.log('🎉 Car should now appear in My Listings for rozeena031@gmail.com');
    } else {
      console.log('❌ Failed to update car ownership');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCarOwnership();