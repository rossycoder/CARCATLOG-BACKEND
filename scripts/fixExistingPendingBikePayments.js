const mongoose = require('mongoose');
require('dotenv').config();

const Bike = require('../models/Bike');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');
const User = require('../models/User');

async function fixExistingPendingBikePayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all pending bike purchases
    const pendingPurchases = await AdvertisingPackagePurchase.find({
      vehicleValue: 'bike',
      paymentStatus: 'pending'
    });

    console.log(`📊 Found ${pendingPurchases.length} pending bike purchases`);

    if (pendingPurchases.length === 0) {
      console.log('✅ No pending bike purchases to fix');
      return;
    }

    for (const purchase of pendingPurchases) {
      console.log(`\n📦 Processing purchase: ${purchase._id}`);
      console.log(`   Customer: ${purchase.customerEmail}`);
      console.log(`   Package: ${purchase.packageName}`);
      console.log(`   Amount: ${purchase.amountFormatted}`);
      
      // Check if userId is in metadata
      const userId = purchase.metadata.get('userId');
      console.log(`   UserId in metadata: ${userId || 'MISSING'}`);
      
      // If userId is missing, try to find user by email
      if (!userId && purchase.customerEmail) {
        const user = await User.findOne({ email: purchase.customerEmail });
        if (user) {
          console.log(`   ✅ Found user by email: ${user._id}`);
          
          // Add userId to metadata
          purchase.metadata.set('userId', user._id.toString());
          await purchase.save();
          console.log(`   ✅ Added userId to purchase metadata`);
        } else {
          console.log(`   ❌ No user found for email: ${purchase.customerEmail}`);
          continue;
        }
      }
      
      // Check if advertId exists
      const advertId = purchase.metadata.get('advertId');
      console.log(`   AdvertId: ${advertId || 'MISSING'}`);
      
      if (advertId) {
        // Check if bike already exists
        const existingBike = await Bike.findOne({ advertId });
        if (existingBike) {
          console.log(`   ⚠️  Bike already exists: ${existingBike._id}`);
          console.log(`   Current status: ${existingBike.status}`);
          
          // Update userId if missing
          if (!existingBike.userId && userId) {
            existingBike.userId = userId;
            await existingBike.save();
            console.log(`   ✅ Added userId to existing bike`);
          }
        } else {
          console.log(`   ❌ No bike found for advertId: ${advertId}`);
          
          // Optionally create bike if all data is available
          const advertData = purchase.metadata.get('advertData');
          const vehicleData = purchase.metadata.get('vehicleData');
          const contactDetails = purchase.metadata.get('contactDetails');
          
          if (advertData && vehicleData && contactDetails) {
            console.log(`   🔧 All data available, could create bike if needed`);
          }
        }
      }
    }

    // Check for bikes without userId
    const bikesWithoutUserId = await Bike.find({ userId: { $exists: false } });
    console.log(`\n📊 Found ${bikesWithoutUserId.length} bikes without userId`);

    for (const bike of bikesWithoutUserId) {
      console.log(`\n🏍️ Bike without userId: ${bike._id}`);
      console.log(`   Make/Model: ${bike.make} ${bike.model}`);
      console.log(`   Email: ${bike.sellerContact?.email}`);
      
      if (bike.sellerContact?.email) {
        const user = await User.findOne({ email: bike.sellerContact.email });
        if (user) {
          bike.userId = user._id;
          await bike.save();
          console.log(`   ✅ Added userId: ${user._id}`);
        } else {
          console.log(`   ❌ No user found for email: ${bike.sellerContact.email}`);
        }
      }
    }

    console.log('\n✅ Existing pending bike payments fix completed!');

  } catch (error) {
    console.error('❌ Error fixing existing pending bike payments:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixExistingPendingBikePayments();