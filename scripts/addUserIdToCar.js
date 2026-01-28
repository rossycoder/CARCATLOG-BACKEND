require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function addUserIdToCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the car
    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.log('❌ Car not found');
      process.exit(0);
    }

    console.log('📝 Current Car Details:');
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   User ID: ${car.userId || 'NOT SET'}`);
    console.log(`   Seller Email: ${car.sellerContact?.email || 'NOT SET'}`);
    
    if (car.userId) {
      console.log('\n✅ Car already has userId set');
      process.exit(0);
    }

    // Find user by email
    const userEmail = car.sellerContact?.email || 'rozeena031@gmail.com';
    console.log(`\n🔍 Looking for user with email: ${userEmail}`);
    
    let user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`⚠️  User not found. Creating new user...`);
      
      // Create a new user
      user = new User({
        email: userEmail,
        name: 'Test User',
        password: 'hashedpassword123', // This should be hashed in real scenario
        role: 'user'
      });
      
      await user.save();
      console.log(`✅ Created new user: ${user._id}`);
    } else {
      console.log(`✅ Found user: ${user._id}`);
    }

    // Add userId to car
    car.userId = user._id;
    await car.save();
    
    console.log(`\n✅ User ID added to car successfully!`);
    console.log(`   User ID: ${car.userId}`);
    console.log(`\n🎉 Car should now appear in "My Listings"!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addUserIdToCar();
