/**
 * Script to activate cars that have "incomplete" status but have completed payment
 * This fixes cars that were created before the auto-activation webhook was working
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateIncompleteCarsWithPayment() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all cars with incomplete status that have:
    // 1. Images
    // 2. Contact details
    // 3. Price
    // 4. Advertising package (meaning payment was made)
    const incompleteCars = await Car.find({
      advertStatus: 'incomplete',
      'advertisingPackage.packageId': { $exists: true },
      images: { $exists: true, $ne: [], $not: { $size: 0 } },
      'sellerContact.email': { $exists: true, $ne: null },
      'sellerContact.phoneNumber': { $exists: true, $ne: null },
      price: { $gt: 0 }
    });

    console.log(`📊 Found ${incompleteCars.length} incomplete cars with payment\n`);

    if (incompleteCars.length === 0) {
      console.log('✅ No cars need activation');
      await mongoose.connection.close();
      return;
    }

    let activatedCount = 0;

    for (const car of incompleteCars) {
      console.log(`\n🚗 Processing car: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Price: £${car.price}`);
      console.log(`   Images: ${car.images.length}`);
      console.log(`   Package: ${car.advertisingPackage?.packageName || 'N/A'}`);
      console.log(`   Contact: ${car.sellerContact?.email || 'N/A'}`);

      // Activate the car
      car.advertStatus = 'active';
      car.publishedAt = car.publishedAt || new Date();

      await car.save();
      activatedCount++;

      console.log(`   ✅ ACTIVATED`);
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total found: ${incompleteCars.length}`);
    console.log(`   Activated: ${activatedCount}`);
    console.log(`\n✅ Done!`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateIncompleteCarsWithPayment();
