/**
 * Fix car seller type to Trade
 * Updates the car with advertId to have sellerContact.type = 'trade'
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Car = require('../models/Car');

const ADVERT_ID = '958c5302-992b-479a-a8de-feb4a93bdb41';
const REGISTRATION = 'EK11XHZ';

async function fixCarSellerType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the car by advertId or registration
    let car = await Car.findOne({ 
      $or: [
        { advertId: ADVERT_ID },
        { registrationNumber: REGISTRATION }
      ]
    });
    
    if (!car) {
      console.error('❌ Car not found');
      console.log('   Tried advertId:', ADVERT_ID);
      console.log('   Tried registration:', REGISTRATION);
      return;
    }

    console.log('\n🚗 Found Car:');
    console.log('   ID:', car._id);
    console.log('   Make/Model:', car.make, car.model);
    console.log('   Registration:', car.registrationNumber);
    console.log('   Advert ID:', car.advertId);
    console.log('   Status:', car.advertStatus);
    console.log('   Current Seller Type:', car.sellerContact?.type || 'NOT SET');

    // Update seller type to trade
    if (!car.sellerContact) {
      car.sellerContact = {};
    }
    
    car.sellerContact.type = 'trade';
    
    await car.save();
    
    console.log('\n✅ Car updated successfully!');
    console.log('   New Seller Type:', car.sellerContact.type);
    console.log('\n📝 The car will now show as "Trade Seller" on the detail page');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixCarSellerType();
