#!/usr/bin/env node
/**
 * Auto-fix all cars - Run this automatically or manually
 * Fixes: coordinates, userId, vehicle history
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const postcodeService = require('../services/postcodeService');

async function autoFixAllCars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active cars
    const cars = await Car.find({ advertStatus: 'active' });
    
    console.log(`📊 Found ${cars.length} active car(s)\n`);

    let fixedCount = 0;
    let alreadyOkCount = 0;

    for (const car of cars) {
      console.log(`🔧 ${car.make} ${car.model} (${car.registrationNumber || 'No Reg'})`);
      let needsUpdate = false;

      // 1. Fix coordinates if missing
      if (car.postcode && (!car.latitude || !car.longitude)) {
        try {
          const postcodeData = await postcodeService.lookupPostcode(car.postcode);
          car.latitude = postcodeData.latitude;
          car.longitude = postcodeData.longitude;
          car.location = {
            type: 'Point',
            coordinates: [postcodeData.longitude, postcodeData.latitude]
          };
          console.log(`   ✅ Coordinates: ${car.latitude}, ${car.longitude}`);
          needsUpdate = true;
        } catch (error) {
          console.log(`   ⚠️  Coordinates: Failed (${error.message})`);
        }
      } else if (car.latitude && car.longitude) {
        console.log(`   ✅ Coordinates: Already set`);
      } else {
        console.log(`   ⚠️  Coordinates: No postcode`);
      }

      // 2. Fix userId if missing
      if (!car.userId && car.sellerContact?.email) {
        try {
          const user = await User.findOne({ email: car.sellerContact.email });
          if (user) {
            car.userId = user._id;
            console.log(`   ✅ User ID: Set`);
            needsUpdate = true;
          } else {
            console.log(`   ⚠️  User ID: No user found`);
          }
        } catch (error) {
          console.log(`   ⚠️  User ID: Failed (${error.message})`);
        }
      } else if (car.userId) {
        console.log(`   ✅ User ID: Already set`);
      } else {
        console.log(`   ⚠️  User ID: No email`);
      }

      // 3. Save if needed
      if (needsUpdate) {
        await car.save();
        fixedCount++;
        console.log(`   💾 UPDATED\n`);
      } else {
        alreadyOkCount++;
        console.log(`   ℹ️  OK\n`);
      }
    }

    console.log(`\n🎉 Complete!`);
    console.log(`   Total: ${cars.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already OK: ${alreadyOkCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  autoFixAllCars();
}

module.exports = autoFixAllCars;
