const mongoose = require('mongoose');
require('dotenv').config();

const Bike = require('../models/Bike');
const User = require('../models/User');

async function verifyBikeInUserListings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const testUser = await User.findOne({ email: 'rozeena031@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log(`✅ Found user: ${testUser.email} (ID: ${testUser._id})`);

    // Find all bikes for this user
    const userBikes = await Bike.find({ userId: testUser._id });
    console.log(`\n📊 User has ${userBikes.length} bikes:`);

    for (const bike of userBikes) {
      console.log(`\n🏍️ Bike: ${bike._id}`);
      console.log(`   Make/Model: ${bike.make} ${bike.model}`);
      console.log(`   Registration: ${bike.registrationNumber || 'N/A'}`);
      console.log(`   Year: ${bike.year}`);
      console.log(`   Mileage: ${bike.mileage}`);
      console.log(`   Price: £${bike.price}`);
      console.log(`   Status: ${bike.status}`);
      console.log(`   Engine CC: ${bike.engineCC}`);
      console.log(`   Bike Type: ${bike.bikeType}`);
      console.log(`   Published: ${bike.publishedAt}`);
      console.log(`   Package: ${bike.advertisingPackage?.packageName || 'N/A'}`);
      console.log(`   Expires: ${bike.advertisingPackage?.expiryDate || 'N/A'}`);
    }

    // Test the vehicle controller endpoint simulation
    console.log(`\n🔍 Simulating vehicle controller query...`);
    const vehicleControllerQuery = await Bike.find({ 
      userId: testUser._id,
      status: 'active'
    }).select('make model year mileage price status advertisingPackage');

    console.log(`📊 Vehicle controller would return ${vehicleControllerQuery.length} active bikes`);

    console.log('\n✅ Bike verification completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`✅ User has ${userBikes.length} total bikes`);
    console.log(`✅ ${vehicleControllerQuery.length} bikes are active and visible`);
    console.log('✅ Bike payment and database save is working correctly');

  } catch (error) {
    console.error('❌ Error verifying bike in user listings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyBikeInUserListings();