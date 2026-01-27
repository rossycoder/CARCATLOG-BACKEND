/**
 * Check Purchase Records
 * 
 * This script shows recent purchase records
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function checkPurchases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find recent purchases
    const purchases = await AdvertisingPackagePurchase.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📊 10 Most Recent Purchases:\n`);

    for (const purchase of purchases) {
      console.log(`\n💳 ${purchase._id}`);
      console.log(`   Package: ${purchase.packageName}`);
      console.log(`   Amount: £${purchase.amount}`);
      console.log(`   Status: ${purchase.paymentStatus}`);
      console.log(`   Registration: ${purchase.registration || 'N/A'}`);
      console.log(`   Vehicle ID: ${purchase.vehicleId || 'Not created yet'}`);
      console.log(`   Created: ${purchase.createdAt}`);
      
      if (purchase.metadata) {
        const userId = purchase.metadata.get('userId');
        const advertId = purchase.metadata.get('advertId');
        console.log(`   User ID: ${userId || 'N/A'}`);
        console.log(`   Advert ID: ${advertId || 'N/A'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
checkPurchases();
