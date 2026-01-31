/**
 * Fix EX09MYY car - Add location name and set seller type to trade
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');
const postcodeService = require('../services/postcodeService');

const CAR_ID = '697e6c41d0d6ae3787785433';
const REGISTRATION = 'EX09MYY';
const POSTCODE = 'L1 1AA';

async function fixCar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car
    const car = await Car.findById(CAR_ID);
    
    if (!car) {
      console.error('❌ Car not found with ID:', CAR_ID);
      return;
    }

    console.log('\n🚗 Current Car Data:');
    console.log('   ID:', car._id);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Postcode:', car.postcode);
    console.log('   Location Name:', car.locationName || '❌ NOT SET');
    console.log('   Latitude:', car.latitude || '❌ NOT SET');
    console.log('   Longitude:', car.longitude || '❌ NOT SET');
    console.log('   Seller Type:', car.sellerContact?.type || '❌ NOT SET');

    let updated = false;

    // Fix 1: Add location data
    if (!car.locationName || !car.latitude || !car.longitude) {
      console.log('\n📍 Fetching location data from postcode:', POSTCODE);
      
      try {
        const postcodeData = await postcodeService.lookupPostcode(POSTCODE);
        
        car.locationName = postcodeData.locationName;
        car.latitude = postcodeData.latitude;
        car.longitude = postcodeData.longitude;
        car.location = {
          type: 'Point',
          coordinates: [postcodeData.longitude, postcodeData.latitude]
        };
        
        console.log('✅ Location data set:');
        console.log('   Location Name:', car.locationName);
        console.log('   Coordinates:', car.latitude, car.longitude);
        
        updated = true;
      } catch (error) {
        console.error('❌ Error fetching postcode data:', error.message);
      }
    }

    // Fix 2: Set seller type to trade
    if (!car.sellerContact) {
      car.sellerContact = {};
    }
    
    if (!car.sellerContact.type || car.sellerContact.type !== 'trade') {
      console.log('\n👔 Setting seller type to TRADE');
      car.sellerContact.type = 'trade';
      console.log('✅ Seller type set to:', car.sellerContact.type);
      updated = true;
    }

    // Save changes
    if (updated) {
      await car.save();
      console.log('\n✅ Car updated successfully!');
      
      console.log('\n📝 Final Car Data:');
      console.log('   Location Name:', car.locationName);
      console.log('   Coordinates:', car.latitude, car.longitude);
      console.log('   Seller Type:', car.sellerContact.type);
      console.log('\n🎉 Car will now show location and "Trade Seller" badge!');
    } else {
      console.log('\n✅ Car already has correct data, no updates needed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixCar();
