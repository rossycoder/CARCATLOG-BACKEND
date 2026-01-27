/**
 * Fix Missing userId for Cars
 * 
 * This script finds cars that are missing userId and attempts to link them
 * to the correct user based on the purchase record or contact email.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function fixMissingUserId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all cars without userId
    const carsWithoutUserId = await Car.find({ 
      userId: { $exists: false }
    }).select('_id advertId registrationNumber sellerContact advertisingPackage');

    console.log(`\n📊 Found ${carsWithoutUserId.length} cars without userId\n`);

    let fixed = 0;
    let notFixed = 0;

    for (const car of carsWithoutUserId) {
      console.log(`\n🚗 Processing car: ${car._id}`);
      console.log(`   Registration: ${car.registrationNumber || 'N/A'}`);
      console.log(`   Advert ID: ${car.advertId || 'N/A'}`);
      console.log(`   Email: ${car.sellerContact?.email || 'N/A'}`);

      let userId = null;

      // Method 1: Try to find user by purchase record
      if (car.advertisingPackage?.stripeSessionId) {
        const purchase = await AdvertisingPackagePurchase.findOne({
          stripeSessionId: car.advertisingPackage.stripeSessionId
        });

        if (purchase && purchase.metadata) {
          const storedUserId = purchase.metadata.get('userId');
          if (storedUserId) {
            userId = storedUserId;
            console.log(`   ✅ Found userId from purchase: ${userId}`);
          }
        }
      }

      // Method 2: Try to find user by email
      if (!userId && car.sellerContact?.email) {
        const user = await User.findOne({ 
          email: car.sellerContact.email 
        });

        if (user) {
          userId = user._id;
          console.log(`   ✅ Found userId from email: ${userId}`);
        }
      }

      // Update car if userId found
      if (userId) {
        car.userId = userId;
        await car.save();
        console.log(`   ✅ Updated car with userId`);
        fixed++;
      } else {
        console.log(`   ⚠️  Could not find userId for this car`);
        notFixed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Not Fixed: ${notFixed}`);
    console.log(`   Total: ${carsWithoutUserId.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
fixMissingUserId();
