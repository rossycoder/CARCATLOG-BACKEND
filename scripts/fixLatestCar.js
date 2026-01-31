/**
 * Fix the latest car - Add location name and set seller type
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

const CAR_ID = '697e6db1d0d6ae37877855ae';

async function fixLatestCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const car = await Car.findById(CAR_ID);
    
    if (!car) {
      console.error('❌ Car not found');
      return;
    }

    console.log('\n🚗 Current Car:');
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Postcode:', car.postcode);
    console.log('   Location Name:', car.locationName || '❌ MISSING');
    console.log('   Seller Type:', car.sellerContact?.type || '❌ MISSING');

    let updated = false;

    // Fix location
    if (car.postcode && !car.locationName) {
      console.log('\n📍 Fetching location...');
      try {
        const postcodeData = await postcodeService.lookupPostcode(car.postcode);
        car.locationName = postcodeData.locationName;
        car.latitude = postcodeData.latitude;
        car.longitude = postcodeData.longitude;
        car.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
        console.log('✅ Location set:', car.locationName);
        updated = true;
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }

    // Fix seller type (set to trade since it was trade payment)
    if (!car.sellerContact) car.sellerContact = {};
    if (!car.sellerContact.type) {
      car.sellerContact.type = 'trade';
      console.log('✅ Seller type set to: trade');
      updated = true;
    }

    if (updated) {
      await car.save();
      console.log('\n✅ Car fixed successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixLatestCar();
