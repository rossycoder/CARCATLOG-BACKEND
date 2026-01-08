/**
 * Script to activate ALL cars that have "incomplete" status but have all required data
 * This will make them visible in search results
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function activateAllIncompleteCars() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all cars with incomplete status
    const incompleteCars = await Car.find({
      advertStatus: 'incomplete'
    });

    console.log(`📊 Found ${incompleteCars.length} incomplete cars\n`);

    if (incompleteCars.length === 0) {
      console.log('✅ No incomplete cars found');
      await mongoose.connection.close();
      return;
    }

    let activatedCount = 0;
    let skippedCount = 0;

    for (const car of incompleteCars) {
      console.log(`\n🚗 Processing car: ${car._id}`);
      console.log(`   Advert ID: ${car.advertId || 'N/A'}`);
      console.log(`   Make/Model: ${car.make} ${car.model}`);
      console.log(`   Price: £${car.price || 0}`);
      console.log(`   Images: ${car.images?.length || 0}`);
      console.log(`   Contact: ${car.sellerContact?.email || 'N/A'}`);

      // Check if car has all required data
      const hasImages = car.images && car.images.length > 0;
      const hasContact = car.sellerContact && car.sellerContact.email && car.sellerContact.phoneNumber;
      const hasPrice = car.price && car.price > 0;

      if (hasImages && hasContact && hasPrice) {
        // Activate the car
        car.advertStatus = 'active';
        car.publishedAt = car.publishedAt || new Date();

        await car.save();
        activatedCount++;

        console.log(`   ✅ ACTIVATED`);
      } else {
        console.log(`   ⚠️  SKIPPED - Missing required data:`);
        if (!hasImages) console.log(`      - No images (${car.images?.length || 0})`);
        if (!hasContact) console.log(`      - No contact details`);
        if (!hasPrice) console.log(`      - No price`);
        skippedCount++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total found: ${incompleteCars.length}`);
    console.log(`   Activated: ${activatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`\n✅ Done!`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateAllIncompleteCars();
