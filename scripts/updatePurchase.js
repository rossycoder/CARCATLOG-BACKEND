require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdvertisingPackagePurchase = require('../models/AdvertisingPackagePurchase');

async function updatePurchase() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const purchase = await AdvertisingPackagePurchase.findById('6978e683f650c6304a3db0c2');
  
  purchase.paymentStatus = 'paid';
  purchase.packageStatus = 'active';
  purchase.vehicleId = '6978ea25a429dace97efbe59';
  purchase.activatedAt = new Date();
  purchase.expiresAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
  purchase.metadata.set('userId', '69777c2416ef8e4c8cb3f422');
  
  await purchase.save();
  console.log('Purchase updated:', purchase._id);
  
  await mongoose.disconnect();
}

updatePurchase().catch(console.error);
