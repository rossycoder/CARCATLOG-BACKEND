require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

async function fixAllCarsCompletely() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allCars = await Car.find({});
    console.log(`📊 Found ${allCars.length} total car(s)\n`);

    let fixedCount = 0;

    for (const car of allCars) {
      let needsSave = false;
      console.log(`\n🚗 Checking: ${car.make} ${car.model} (${car.registrationNumber || 'No Reg'})`);
      
      // Fix 1: Set status to active if draft
      if (car.advertStatus === 'draft') {
        car.advertStatus = 'active';
        needsSave = true;
        console.log('   ✅ Status changed: draft → active');
      }
      
      // Fix 2: Set publishedAt if missing
      if (car.advertStatus === 'active' && !car.publishedAt) {
        car.publishedAt = new Date();
        needsSave = true;
        console.log('   ✅ Published date set');
      }
      
      // Fix 3: Set userId from email if missing
      if (!car.userId && car.sellerContact?.email) {
        const user = await User.findOne({ email: car.sellerContact.email });
        if (user) {
          car.userId = user._id;
          needsSave = true;
          console.log(`   ✅ User ID set: ${user._id}`);
        } else {
          console.log(`   ⚠️  No user found for: ${car.sellerContact.email}`);
        }
      }
      
      // Fix 4: Set coordinates from postcode if missing
      if ((!car.latitude || !car.longitude) && car.postcode) {
        try {
          const postcodeService = require('../services/postcodeService');
          const postcodeData = await postcodeService.lookupPostcode(car.postcode);
          
          car.latitude = postcodeData.latitude;
          car.longitude = postcodeData.longitude;
          needsSave = true;
          console.log(`   ✅ Coordinates set: ${car.latitude}, ${car.longitude}`);
        } catch (error) {
          console.log(`   ⚠️  Could not fetch coordinates: ${error.message}`);
        }
      }
      
      if (needsSave) {
        await car.save();
        fixedCount++;
        console.log('   💾 Saved changes');
      } else {
        console.log('   ✓ Already complete');
      }
    }

    console.log(`\n\n📈 Summary:`);
    console.log(`   Total cars: ${allCars.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already complete: ${allCars.length - fixedCount}`);
    
    console.log(`\n🎉 All cars are now fully configured!`);
    console.log(`\n💡 All cars will now show in:`);
    console.log(`   ✅ Search results`);
    console.log(`   ✅ My Listings`);
    console.log(`   ✅ Location searches`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllCarsCompletely();
