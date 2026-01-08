/**
 * Script to activate cars that are stuck in "pending_payment" status
 * This happens when Stripe webhook doesn't fire in test mode
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activatePendingPaymentCars() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all cars with pending_payment status that have all required data
    const pendingCars = await Car.find({
      advertStatus: 'pending_payment',
      'advertisingPackage.stripeSessionId': { $exists: true },
      images: { $exists: true, $ne: [], $not: { $size: 0 } },
      'sellerContact.email': { $exists: true, $ne: null },
      'sellerContact.phoneNumber': { $exists: true, $ne: null },
      price: { $gt: 0 }
    });

    console.log(`📊 Found ${pendingCars.length} cars with pending_payment status\n`);

    if (pendingCars.length === 0) {
      console.log('✅ No cars need activation');
      await mongoose.connection.close();
      return;
    }

    let activatedCount = 0;

    for (const car of pendingCars) {
      console.log(`\n🚗 Processing car: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Year: ${car.year}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Images: ${car.images.length}`);
      console.log(`   Package: ${car.advertisingPackage?.packageName || 'N/A'}`);
      console.log(`   Stripe Session: ${car.advertisingPackage?.stripeSessionId || 'N/A'}`);

      // Activate the car
      car.advertStatus = 'active';
      car.publishedAt = car.publishedAt || new Date();

      await car.save();
      activatedCount++;

      console.log(`   ✅ ACTIVATED - Now visible in search results!`);
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total found: ${pendingCars.length}`);
    console.log(`   Activated: ${activatedCount}`);
    console.log(`\n✅ All cars are now active and visible!`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activatePendingPaymentCars();
