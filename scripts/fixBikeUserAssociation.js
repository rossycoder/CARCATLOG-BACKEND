/**
 * Fix bike user association - add userId to existing bikes
 * This is a security fix to ensure bikes are only shown to their owners
 */

const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const User = require('../models/User');

async function fixBikeUserAssociation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('✅ Connected to MongoDB');

    console.log('🔧 FIXING BIKE USER ASSOCIATION');
    console.log('='.repeat(50));

    // Find bikes without userId
    const bikesWithoutUser = await Bike.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`📊 Found ${bikesWithoutUser.length} bikes without user association`);

    if (bikesWithoutUser.length === 0) {
      console.log('✅ All bikes already have user association');
      return;
    }

    // Get the first user from database (for demo purposes)
    const firstUser = await User.findOne({});
    
    if (!firstUser) {
      console.log('❌ No users found in database');
      console.log('   Create a user first before running this script');
      return;
    }

    console.log(`👤 Using user: ${firstUser.email} (ID: ${firstUser._id})`);
    console.log('');

    // Update each bike
    for (let i = 0; i < bikesWithoutUser.length; i++) {
      const bike = bikesWithoutUser[i];
      
      console.log(`${i + 1}. Updating bike: ${bike.make} ${bike.model} (${bike._id})`);
      
      try {
        await Bike.findByIdAndUpdate(bike._id, {
          userId: firstUser._id
        });
        console.log('   ✅ Updated successfully');
      } catch (error) {
        console.log(`   ❌ Failed to update: ${error.message}`);
      }
    }

    // Verify the fix
    console.log('');
    console.log('🔍 VERIFICATION:');
    const bikesWithUser = await Bike.find({ userId: { $exists: true, $ne: null } });
    const bikesWithoutUserAfter = await Bike.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`✅ Bikes with user association: ${bikesWithUser.length}`);
    console.log(`❌ Bikes without user association: ${bikesWithoutUserAfter.length}`);

    if (bikesWithoutUserAfter.length === 0) {
      console.log('');
      console.log('🎉 SUCCESS! All bikes now have user association');
      console.log('   Bikes will now only show to their owners in /my-listings');
    } else {
      console.log('');
      console.log('⚠️ Some bikes still need fixing');
    }

    // Show sample of fixed bikes
    console.log('');
    console.log('📋 SAMPLE OF FIXED BIKES:');
    const sampleBikes = await Bike.find({ userId: firstUser._id }).limit(3);
    sampleBikes.forEach((bike, index) => {
      console.log(`   ${index + 1}. ${bike.make} ${bike.model} - Owner: ${firstUser.email}`);
    });

  } catch (error) {
    console.error('❌ Error fixing bike user association:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the fix
fixBikeUserAssociation();