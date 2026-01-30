/**
 * Fix userId for specific car (RJ08PFA)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixCarUserId() {
  try {
    console.log('🔧 Fixing userId for car RJ08PFA...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the car
    const car = await Car.findOne({ registrationNumber: 'RJ08PFA' });
    
    if (!car) {
      console.error('❌ Car not found with registration RJ08PFA');
      return;
    }

    console.log('📋 Current Car Data:');
    console.log(`   ID: ${car._id}`);
    console.log(`   Make/Model: ${car.make} ${car.model}`);
    console.log(`   Registration: ${car.registrationNumber}`);
    console.log(`   Status: ${car.advertStatus}`);
    console.log(`   Current userId: ${car.userId || 'MISSING ❌'}`);
    console.log(`   Seller Email: ${car.sellerContact?.email || 'MISSING'}`);
    console.log('');

    // Find user by email
    if (car.sellerContact?.email) {
      const user = await User.findOne({ email: car.sellerContact.email });
      
      if (user) {
        console.log('✅ Found user:');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log('');

        // Set userId
        car.userId = user._id;
        await car.save();

        console.log('✅ userId has been set!');
        console.log(`   Car ID: ${car._id}`);
        console.log(`   User ID: ${car.userId}`);
        console.log('');
        console.log('🎉 Car will now appear in My Listings!');
      } else {
        console.error('❌ No user found with email:', car.sellerContact.email);
        console.log('');
        console.log('💡 Available users:');
        const users = await User.find().limit(5);
        users.forEach(u => {
          console.log(`   - ${u.email} (${u._id})`);
        });
      }
    } else {
      console.error('❌ No seller email found in car data');
      console.log('');
      console.log('💡 You can manually set userId:');
      console.log('   1. Find user: node backend/scripts/checkUserCars.js');
      console.log('   2. Set userId: node backend/scripts/addUserIdToCar.js <car_id> <user_id>');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixCarUserId();
