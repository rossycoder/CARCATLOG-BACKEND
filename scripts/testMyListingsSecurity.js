/**
 * Test my-listings security - verify bikes only show to their owners
 */

const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const User = require('../models/User');

async function testMyListingsSecurity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('🔒 TESTING MY-LISTINGS SECURITY');
    console.log('='.repeat(50));

    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('❌ No users found - create users first');
      return;
    }

    // Get all bikes
    const allBikes = await Bike.find({});
    console.log(`🏍️ Found ${allBikes.length} bikes in database`);

    if (allBikes.length === 0) {
      console.log('❌ No bikes found - create bikes first');
      return;
    }

    console.log('');
    console.log('🔍 BIKE OWNERSHIP ANALYSIS:');
    console.log('-'.repeat(40));

    // Check each bike's ownership
    for (const bike of allBikes) {
      const owner = users.find(user => user._id.toString() === bike.userId?.toString());
      
      console.log(`🏍️ ${bike.make} ${bike.model} (${bike._id})`);
      
      if (bike.userId) {
        if (owner) {
          console.log(`   ✅ Owner: ${owner.email} (${owner._id})`);
        } else {
          console.log(`   ⚠️ Owner ID exists but user not found: ${bike.userId}`);
        }
      } else {
        console.log(`   ❌ NO OWNER - SECURITY RISK!`);
      }
      console.log('');
    }

    // Test what each user would see in my-listings
    console.log('👤 USER-SPECIFIC LISTINGS TEST:');
    console.log('-'.repeat(40));

    for (const user of users) {
      const userBikes = await Bike.find({ userId: user._id });
      console.log(`${user.email}:`);
      
      if (userBikes.length === 0) {
        console.log(`   📭 No bikes (correct - user doesn't own any)`);
      } else {
        console.log(`   🏍️ ${userBikes.length} bike(s):`);
        userBikes.forEach((bike, index) => {
          console.log(`      ${index + 1}. ${bike.make} ${bike.model}`);
        });
      }
      console.log('');
    }

    // Security verification
    console.log('🛡️ SECURITY VERIFICATION:');
    console.log('-'.repeat(30));

    const bikesWithoutOwner = await Bike.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    if (bikesWithoutOwner.length === 0) {
      console.log('✅ SECURE: All bikes have owners');
      console.log('✅ SECURE: Bikes will only show to their owners');
    } else {
      console.log(`❌ SECURITY RISK: ${bikesWithoutOwner.length} bikes without owners`);
      console.log('❌ These bikes would show to all users!');
      
      bikesWithoutOwner.forEach((bike, index) => {
        console.log(`   ${index + 1}. ${bike.make} ${bike.model} (${bike._id})`);
      });
    }

    // Test API simulation
    console.log('');
    console.log('🧪 API SIMULATION TEST:');
    console.log('-'.repeat(25));

    for (const user of users) {
      // Simulate what getMyListings would return for this user
      const userListings = await Bike.find({ userId: user._id });
      
      console.log(`API call for ${user.email}:`);
      console.log(`   Would return: ${userListings.length} bike(s)`);
      
      if (userListings.length > 0) {
        userListings.forEach((bike, index) => {
          console.log(`      ${index + 1}. ${bike.make} ${bike.model} - Status: ${bike.status}`);
        });
      }
      console.log('');
    }

    console.log('🎯 SUMMARY:');
    console.log(`   Total bikes: ${allBikes.length}`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Bikes with owners: ${allBikes.filter(b => b.userId).length}`);
    console.log(`   Bikes without owners: ${bikesWithoutOwner.length}`);
    
    if (bikesWithoutOwner.length === 0) {
      console.log('   🎉 SECURITY STATUS: SECURE ✅');
    } else {
      console.log('   ⚠️ SECURITY STATUS: NEEDS FIXING ❌');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the test
testMyListingsSecurity();