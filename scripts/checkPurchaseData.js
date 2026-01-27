/**
 * Check Purchase Data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function checkPurchaseData(purchaseId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const purchase = await AdvertisingPackagePurchase.findById(purchaseId);

    if (!purchase) {
      console.log(`❌ Purchase not found`);
      return;
    }

    console.log(`\n💳 Purchase: ${purchase._id}`);
    console.log(`   Package: ${purchase.packageName}`);
    console.log(`   Status: ${purchase.paymentStatus}`);

    if (purchase.metadata) {
      const advertData = JSON.parse(purchase.metadata.get('advertData') || '{}');
      const vehicleData = JSON.parse(purchase.metadata.get('vehicleData') || '{}');
      const contactDetails = JSON.parse(purchase.metadata.get('contactDetails') || '{}');

      console.log(`\n📦 Vehicle Data:`);
      console.log(JSON.stringify(vehicleData, null, 2));

      console.log(`\n📦 Advert Data:`);
      console.log(JSON.stringify(advertData, null, 2));

      console.log(`\n📦 Contact Details:`);
      console.log(JSON.stringify(contactDetails, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const purchaseId = process.argv[2] || '6978e683f650c6304a3db0c2';
checkPurchaseData(purchaseId);
