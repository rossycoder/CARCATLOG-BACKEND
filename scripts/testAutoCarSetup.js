require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function testAutoCarSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // First, ensure test user exists
    const testEmail = 'rozeena031@gmail.com';
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('⚠️  Test user not found, creating...');
      user = new User({
        email: testEmail,
        name: 'Test User',
        password: '$2a$10$dummyhashedpassword',
        role: 'user'
      });
      await user.save();
      console.log(`✅ Created test user: ${user._id}\n`);
    } else {
      console.log(`✅ Found test user: ${user._id}\n`);
    }

    // Create a test car with minimal data
    console.log('🚗 Creating test car with automatic setup...\n');
    
    const testCar = new Car({
      make: 'TEST',
      model: 'AutoSetup',
      variant: 'Test Variant',
      year: 2020,
      mileage: 50000,
      price: 10000,
      color: 'Blue',
      fuelType: 'Petrol',
      transmission: 'manual',
      registrationNumber: 'TEST123',
      description: 'Test car for automatic setup verification',
      postcode: 'L1 1AA', // This should trigger automatic coordinate lookup
      sellerContact: {
        email: testEmail, // This should trigger automatic userId lookup
        phoneNumber: '+447354253530',
        postcode: 'L1 1AA'
      }
      // Note: We're NOT setting advertStatus, userId, or coordinates manually
      // These should be set automatically by the pre-save hook
    });

    await testCar.save();

    console.log('📊 Test Car Created:\n');
    console.log(`   MongoDB ID: ${testCar._id}`);
    console.log(`   Make/Model: ${testCar.make} ${testCar.model}`);
    console.log(`   Registration: ${testCar.registrationNumber}`);
    console.log(`   Status: ${testCar.advertStatus} ${testCar.advertStatus === 'active' ? '✅' : '❌'}`);
    console.log(`   Published At: ${testCar.publishedAt || 'NOT SET'}`);
    console.log(`   User ID: ${testCar.userId || 'NOT SET'} ${testCar.userId ? '✅' : '❌'}`);
    console.log(`   Postcode: ${testCar.postcode}`);
    console.log(`   Coordinates: ${testCar.latitude && testCar.longitude ? `${testCar.latitude}, ${testCar.longitude} ✅` : 'NOT SET ❌'}`);
    console.log(`   Seller Email: ${testCar.sellerContact?.email}`);

    console.log('\n📋 Verification:\n');
    
    const checks = {
      'Status is active': testCar.advertStatus === 'active',
      'User ID is set': !!testCar.userId,
      'Coordinates are set': !!(testCar.latitude && testCar.longitude),
      'Published date is set': !!testCar.publishedAt
    };

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 SUCCESS! All automatic setup working correctly!');
      console.log('\n💡 This car will now show in:');
      console.log('   ✅ Search results');
      console.log('   ✅ My Listings (for user: rozeena031@gmail.com)');
      console.log('   ✅ Location-based searches');
    } else {
      console.log('\n⚠️  WARNING: Some automatic setup failed!');
      console.log('   Please check the pre-save hook in backend/models/Car.js');
    }

    // Clean up test car
    console.log('\n🧹 Cleaning up test car...');
    await Car.deleteOne({ _id: testCar._id });
    console.log('✅ Test car deleted');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAutoCarSetup();
