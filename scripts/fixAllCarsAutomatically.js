require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const postcodeService = require('../services/postcodeService');

async function fixAllCarsAutomatically() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cars
    const cars = await Car.find({});
    
    console.log(`📊 Found ${cars.length} car(s) in database\n`);

    let fixedCount = 0;

    for (const car of cars) {
      console.log(`\n🔧 Processing: ${car.make} ${car.model} (${car.registrationNumber || 'No Reg'})`);
      let updated = false;

      // 1. Fix coordinates if missing
      if (car.postcode && (!car.latitude || !car.longitude)) {
        try {
          console.log(`   📍 Fetching coordinates for postcode: ${car.postcode}`);
          const postcodeData = await postcodeService.lookupPostcode(car.postcode);
          
          car.latitude = postcodeData.latitude;
          car.longitude = postcodeData.longitude;
          car.location = {
            type: 'Point',
            coordinates: [postcodeData.longitude, postcodeData.latitude]
          };
          
          console.log(`   ✅ Coordinates set: ${car.latitude}, ${car.longitude}`);
          updated = true;
        } catch (error) {
          console.log(`   ⚠️  Could not fetch coordinates: ${error.message}`);
        }
      } else if (car.latitude && car.longitude) {
        console.log(`   ✅ Coordinates already set`);
      }

      // 2. Fix userId if missing
      if (!car.userId && car.sellerContact?.email) {
        try {
          console.log(`   👤 Looking up user for email: ${car.sellerContact.email}`);
          const user = await User.findOne({ email: car.sellerContact.email });
          
          if (user) {
            car.userId = user._id;
            console.log(`   ✅ User ID set: ${car.userId}`);
            updated = true;
          } else {
            console.log(`   ⚠️  No user found for email: ${car.sellerContact.email}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Could not set userId: ${error.message}`);
        }
      } else if (car.userId) {
        console.log(`   ✅ User ID already set`);
      }

      // 3. Save if updated
      if (updated) {
        await car.save();
        fixedCount++;
        console.log(`   💾 Car updated successfully`);
      } else {
        console.log(`   ℹ️  No updates needed`);
      }
    }

    console.log(`\n\n🎉 Complete!`);
    console.log(`   Total cars: ${cars.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already OK: ${cars.length - fixedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllCarsAutomatically();
